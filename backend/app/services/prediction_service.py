import numpy as np
import joblib
from typing import Dict, List
from app.schemas.application import CreditApplicationCreate, SHAPExplanation


class FeatureVector:
    def __init__(self, features: Dict[str, float], feature_names: List[str]):
        self.features = features
        self.feature_names = feature_names


class CreditScoreResult:
    def __init__(self, credit_score: float, default_probability: float, 
                 risk_category: str, shap_explanations: List[SHAPExplanation],
                 model_version: str):
        self.credit_score = credit_score
        self.default_probability = default_probability
        self.risk_category = risk_category
        self.shap_explanations = shap_explanations
        self.model_version = model_version


class PredictionService:
    def __init__(self, model_path: str, shap_explainer_path: str, feature_names_path: str):
        """Initialize with pre-trained model"""
        self.model = joblib.load(model_path)
        self.shap_explainer = joblib.load(shap_explainer_path)
        self.expected_features = joblib.load(feature_names_path)
        self.model_version = "xgboost_v1.0"
    
    def engineer_features(self, application_data: CreditApplicationCreate) -> FeatureVector:
        """Extract and engineer features from application data.
        Uses priority-based mapping to convert any combination of alternative
        data inputs into the 13 traditional credit features the model expects.
        """
        alt = application_data.alternative_data
        features = {}

        # --- Always available: age and income ---
        features['age'] = float(application_data.age)
        features['age_squared'] = float(application_data.age ** 2)
        features['MonthlyIncome'] = float(application_data.monthly_income)
        features['monthly_income_log'] = float(np.log1p(features['MonthlyIncome']))

        # DebtRatio from loan amount and income
        features['DebtRatio'] = float(
            application_data.requested_amount / (features['MonthlyIncome'] * 12)
            if features['MonthlyIncome'] > 0 else 0.5
        )
        features['debt_ratio_log'] = float(np.log1p(features['DebtRatio']))

        # --- NumberOfOpenCreditLinesAndLoans ---
        # Priority: microfinance_count > upi_frequency > remittance_frequency > default
        if alt.microfinance_repayment_count is not None and alt.upi_transaction_frequency is not None:
            features['NumberOfOpenCreditLinesAndLoans'] = int(max(1, (alt.microfinance_repayment_count + alt.upi_transaction_frequency / 10) / 2))
        elif alt.microfinance_repayment_count is not None:
            features['NumberOfOpenCreditLinesAndLoans'] = int(max(1, alt.microfinance_repayment_count))
        elif alt.upi_transaction_frequency is not None:
            features['NumberOfOpenCreditLinesAndLoans'] = int(max(1, alt.upi_transaction_frequency / 10))
        elif alt.remittance_frequency is not None:
            features['NumberOfOpenCreditLinesAndLoans'] = int(max(1, alt.remittance_frequency / 5))
        else:
            features['NumberOfOpenCreditLinesAndLoans'] = 2

        # --- NumberOfTimes90DaysLate ---
        # Priority: community_score > gig_rating > utility_payment_history > default
        if alt.community_verification_score is not None and alt.gig_platform_rating is not None:
            late_90 = (max(0, 10 - alt.community_verification_score) + max(0, 5 - alt.gig_platform_rating)) / 2
        elif alt.community_verification_score is not None:
            late_90 = max(0, 10 - alt.community_verification_score)
        elif alt.gig_platform_rating is not None:
            late_90 = max(0, 5 - alt.gig_platform_rating)
        elif alt.utility_payment_history is not None:
            late_90 = 0 if alt.utility_payment_history.lower() == 'good' else 2
        else:
            late_90 = 1
        features['NumberOfTimes90DaysLate'] = int(late_90)

        # --- NumberOfTime60-89DaysPastDueNotWorse ---
        # Same signals, slightly lower ceiling
        if alt.community_verification_score is not None and alt.gig_platform_rating is not None:
            late_60 = (max(0, 8 - alt.community_verification_score) + max(0, 4 - alt.gig_platform_rating)) / 2
        elif alt.community_verification_score is not None:
            late_60 = max(0, 8 - alt.community_verification_score)
        elif alt.gig_platform_rating is not None:
            late_60 = max(0, 4 - alt.gig_platform_rating)
        elif alt.utility_payment_history is not None:
            late_60 = 0 if alt.utility_payment_history.lower() == 'good' else 1
        else:
            late_60 = 1
        features['NumberOfTime60-89DaysPastDueNotWorse'] = int(late_60)

        # --- NumberRealEstateLoansOrLines & has_real_estate ---
        # Priority: savings_balance > default
        if alt.savings_account_balance is not None:
            has_re = 1 if alt.savings_account_balance > 50000 else 0
        else:
            has_re = 0
        features['NumberRealEstateLoansOrLines'] = has_re
        features['has_real_estate'] = has_re

        # --- NumberOfDependents ---
        features['NumberOfDependents'] = 2

        # --- total_late_payments ---
        features['total_late_payments'] = (
            features['NumberOfTimes90DaysLate'] +
            features['NumberOfTime60-89DaysPastDueNotWorse']
        )

        return FeatureVector(features=features, feature_names=self.expected_features)
    
    def predict_credit_score(self, features: FeatureVector) -> CreditScoreResult:
        """Predict credit score and generate SHAP explanations"""
        # Prepare feature array
        feature_array = np.array([features.features[name] for name in features.feature_names])
        feature_array = feature_array.reshape(1, -1)
        
        # Predict default probability
        default_probability = float(self.model.predict_proba(feature_array)[0, 1])
        
        # Convert to credit score (300-850 scale)
        credit_score = 300 + (850 - 300) * (1 - default_probability)
        credit_score = float(np.clip(credit_score, 300, 850))
        
        # Determine risk category
        risk_category = self.calculate_risk_category(credit_score)
        
        # Generate SHAP explanations
        shap_explanations = self.generate_shap_explanation(features, feature_array)
        
        return CreditScoreResult(
            credit_score=credit_score,
            default_probability=default_probability,
            risk_category=risk_category,
            shap_explanations=shap_explanations,
            model_version=self.model_version
        )
    
    def calculate_risk_category(self, credit_score: float) -> str:
        """Categorize risk based on credit score"""
        if credit_score >= 700:
            return "low"
        elif credit_score >= 600:
            return "medium"
        else:
            return "high"
    
    def generate_shap_explanation(self, features: FeatureVector, feature_array: np.ndarray) -> List[SHAPExplanation]:
        """Generate SHAP values for model transparency"""
        try:
            shap_values = self.shap_explainer.shap_values(feature_array)
            
            # Create explanations for all features
            feature_importance = []
            for i, feature_name in enumerate(features.feature_names):
                shap_value = float(shap_values[0][i])
                feature_value = float(features.features[feature_name])
                impact = "positive" if shap_value > 0 else "negative"
                
                feature_importance.append(
                    SHAPExplanation(
                        feature_name=feature_name,
                        feature_value=feature_value,
                        shap_value=shap_value,
                        impact=impact
                    )
                )
            
            # Sort by absolute SHAP value and take top 10
            feature_importance.sort(key=lambda x: abs(x.shap_value), reverse=True)
            return feature_importance[:10]
        
        except Exception as e:
            print(f"SHAP explanation failed: {e}")
            return []

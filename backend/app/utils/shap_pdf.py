from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
from datetime import datetime


def generate_shap_pdf(application, credit_score) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('title', fontSize=18, alignment=TA_CENTER,
                                  fontName='Helvetica-Bold', spaceAfter=6)
    subtitle_style = ParagraphStyle('subtitle', fontSize=11, alignment=TA_CENTER,
                                     textColor=colors.grey, spaceAfter=20)
    section_style = ParagraphStyle('section', fontSize=13, fontName='Helvetica-Bold',
                                    spaceBefore=16, spaceAfter=8)
    normal = styles['Normal']

    story = []

    # Header
    story.append(Paragraph("AI Credit Scoring Platform", title_style))
    story.append(Paragraph("SHAP Explainability Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#1a73e8')))
    story.append(Spacer(1, 0.4*cm))

    # Application Info
    story.append(Paragraph("Application Details", section_style))
    app_data = [
        ["Application ID", str(application.id)],
        ["Applicant Name", application.full_name or "N/A"],
        ["Applicant Type", application.applicant_type.capitalize()],
        ["Requested Amount", f"₹{application.requested_amount:,.0f}"],
        ["Loan Purpose", application.loan_purpose or "N/A"],
        ["Status", application.status.replace('_', ' ').upper()],
        ["Report Generated", datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")],
    ]
    app_table = Table(app_data, colWidths=[5*cm, 11*cm])
    app_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f4ff')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#fafafa')]),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(app_table)
    story.append(Spacer(1, 0.4*cm))

    # Credit Score Summary
    story.append(Paragraph("Credit Score Summary", section_style))
    risk_color = colors.HexColor('#4CAF50') if credit_score.risk_category == 'low' else \
                 colors.HexColor('#FF9800') if credit_score.risk_category == 'medium' else \
                 colors.HexColor('#f44336')

    score_data = [
        ["Credit Score", f"{credit_score.credit_score:.0f} / 850"],
        ["Default Probability", f"{credit_score.default_probability * 100:.1f}%"],
        ["Risk Category", credit_score.risk_category.upper()],
        ["Model Version", credit_score.model_version],
    ]
    score_table = Table(score_data, colWidths=[5*cm, 11*cm])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f4ff')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#fafafa')]),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('TEXTCOLOR', (1, 2), (1, 2), risk_color),
        ('FONTNAME', (1, 2), (1, 2), 'Helvetica-Bold'),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 0.4*cm))

    # SHAP Explanations
    story.append(Paragraph("Feature Contribution Analysis (SHAP Values)", section_style))
    story.append(Paragraph(
        "Each feature's SHAP value shows how much it pushed the credit score up (positive) or down (negative).",
        normal
    ))
    story.append(Spacer(1, 0.3*cm))

    shap_data = [["Feature", "Value", "SHAP Value", "Impact"]]
    for exp in credit_score.shap_explanations:
        impact = "↑ Positive" if exp['impact'] == 'positive' else "↓ Negative"
        shap_data.append([
            exp['feature_name'],
            f"{exp['feature_value']:.2f}",
            f"{exp['shap_value']:+.4f}",
            impact
        ])

    shap_table = Table(shap_data, colWidths=[6*cm, 3*cm, 3.5*cm, 3.5*cm])
    shap_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a73e8')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fafafa')]),
    ]
    for i, exp in enumerate(credit_score.shap_explanations, start=1):
        color = colors.HexColor('#e8f5e9') if exp['impact'] == 'positive' else colors.HexColor('#ffebee')
        shap_style.append(('BACKGROUND', (3, i), (3, i), color))

    shap_table.setStyle(TableStyle(shap_style))
    story.append(shap_table)
    story.append(Spacer(1, 0.6*cm))

    # Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        "This report is generated by the AI Credit Scoring Platform. "
        "SHAP values are computed using TreeExplainer on the XGBoost model.",
        ParagraphStyle('footer', fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    ))

    doc.build(story)
    return buffer.getvalue()

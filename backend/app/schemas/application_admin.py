from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., description="New status for the application")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes about the status update")
    reason: Optional[str] = Field(None, max_length=500, description="Optional reason for the status update")


class ApplicationDetailResponse(BaseModel):
    id: int
    user_id: int
    applicant_type: str
    full_name: str
    age: int
    phone_number: str
    address: str
    requested_amount: float
    loan_purpose: str
    alternative_data: dict
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

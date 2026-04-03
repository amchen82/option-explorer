from pydantic import BaseModel, ConfigDict


class TestTokenRequest(BaseModel):
    email: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    oauth_provider: str
    oauth_id: str

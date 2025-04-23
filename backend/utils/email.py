import os
import resend
from fastapi import HTTPException

def send_confirmation_email(email: str, reg_token_ciphertext: str):
    """Send a confirmation email with a link containing the registration token."""
    try:
        with open("email_template.html", "r") as email_template:
            formatted_email_str = email_template.read().format(reg_token_ciphertext)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Email template not found")

    params: resend.Emails.SendParams = {
        "from": "noreply@resend.reesenorr.is",
        "to": [email],
        "subject": "Confirm your email",
        "html": formatted_email_str,
    }
    resend.api_key = os.environ["RESEND_API_KEY"]
    resend.Emails.send(params)

    return
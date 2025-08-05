import smtplib
import os

smtp_user = "geral@9rocks.pt"
smtp_pass = "kmer bekx mbbj uzdh"  # Sua password atual

try:
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
    print("✅ SMTP funcionando!")
except Exception as e:
    print(f"❌ Erro SMTP: {e}")
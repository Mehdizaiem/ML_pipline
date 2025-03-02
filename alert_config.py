import requests
import logging
import json
import os
from datetime import datetime

class AlertManager:
    def __init__(self, config_file="alert_config.json"):
        self.logger = logging.getLogger(__name__)
        self.config = self._load_config(config_file)
        
    def _load_config(self, config_file):
        if not os.path.exists(config_file):
            # Create default config if doesn't exist
            default_config = {
                "enabled": True,
                "thresholds": {
                    "accuracy": 0.85,
                    "f1_score": 0.80,
                    "data_drift": 0.3
                },
                "notifications": {
                    "email": {
                        "enabled": False,
                        "recipients": []
                    },
                    "slack": {
                        "enabled": False,
                        "webhook_url": ""
                    }
                }
            }
            with open(config_file, 'w') as f:
                json.dump(default_config, f, indent=2)
            return default_config
        
        with open(config_file, 'r') as f:
            return json.load(f)
    
    def check_and_alert(self, metrics):
        """Check metrics against thresholds and send alerts if needed"""
        if not self.config["enabled"]:
            return False
            
        alerts = []
        
        # Check accuracy
        if metrics["accuracy"] < self.config["thresholds"]["accuracy"]:
            alerts.append(f"Model accuracy ({metrics['accuracy']:.4f}) is below threshold ({self.config['thresholds']['accuracy']:.4f})")
            
        # Check F1 score
        if metrics["f1_score"] < self.config["thresholds"]["f1_score"]:
            alerts.append(f"Model F1 score ({metrics['f1_score']:.4f}) is below threshold ({self.config['thresholds']['f1_score']:.4f})")
            
        # Check data drift if available
        if metrics.get("data_drift_score") and metrics["data_drift_score"] > self.config["thresholds"]["data_drift"]:
            alerts.append(f"Data drift score ({metrics['data_drift_score']:.4f}) exceeds threshold ({self.config['thresholds']['data_drift']:.4f})")
            
        if alerts:
            self._send_alerts(alerts)
            return True
            
        return False
    
    def _send_alerts(self, alert_messages):
        """Send alerts through configured channels"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        alert_text = f"⚠️ ML Model Alert ({timestamp}):\n" + "\n".join(alert_messages)
        
        # Log the alert
        self.logger.warning(alert_text)
        
        # Save to alerts log
        with open("monitoring_logs/alerts.log", "a") as f:
            f.write(f"{timestamp} - {alert_text}\n")
            
        # Send email if configured
        if self.config["notifications"]["email"]["enabled"]:
            self._send_email_alert(alert_text)
            
        # Send Slack if configured
        if self.config["notifications"]["slack"]["enabled"]:
            self._send_slack_alert(alert_text)
    
    def _send_email_alert(self, alert_text):
        """Send alert via email - implementation would depend on your email provider"""
        # This is a placeholder - you would implement according to your environment
        self.logger.info(f"Would send email alert: {alert_text}")
        
    def _send_slack_alert(self, alert_text):
        """Send alert to Slack"""
        webhook_url = self.config["notifications"]["slack"]["webhook_url"]
        if not webhook_url:
            self.logger.warning("Slack alerts enabled but no webhook URL configured")
            return
            
        try:
            payload = {"text": alert_text}
            response = requests.post(
                webhook_url,
                data=json.dumps(payload),
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
        except Exception as e:
            self.logger.error(f"Failed to send Slack alert: {str(e)}")

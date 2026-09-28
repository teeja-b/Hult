"""
Expo push notifications for the EduConnect mobile app.

The Android/iOS app registers an *Expo* push token ("ExponentPushToken[...]").
firebase_admin can't send to those — FCM rejects them — so pushes to the
phone silently failed. Expo tokens are sent through Expo's push service
instead, which delivers via FCM using the FCM V1 key uploaded to EAS.

Web (browser) FCM tokens are still sent with firebase_admin as before.
"""
import requests

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

# Android channel + action buttons per notification type. The channel ids and
# the "incoming_call" category are created by the app (src/firebaseConfig.js).
_TYPE_SETTINGS = {
    "call":    {"channelId": "incoming_calls_v2",    "priority": "high",    "categoryId": "incoming_call", "ttl": 45},
    "message": {"channelId": "messages", "priority": "high",    "categoryId": None,            "ttl": 86400},
    "call_cancelled": {"channelId": "incoming_calls_v2", "priority": "high", "categoryId": None, "ttl": 60},
}
_DEFAULT = {"channelId": "general", "priority": "default", "categoryId": None, "ttl": 86400}


def is_expo_token(token):
    return isinstance(token, str) and (
        token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken[")
    )


def send_expo_push(tokens, title, body, data=None, notification_type="general"):
    """
    Send one notification to a list of Expo push tokens.
    Returns (number_sent_ok, set_of_tokens_to_deactivate).
    """
    if not tokens:
        return 0, set()

    settings = _TYPE_SETTINGS.get(notification_type, _DEFAULT)
    payload_data = {k: v for k, v in (data or {}).items() if v is not None}
    payload_data["type"] = notification_type

    # Calls (and call cancellations) are sent *data-only*: the app receives them
    # in a background task and draws the notification itself, which is what
    # lets it attach the Accept / Decline buttons. Everything else is a normal
    # visible notification.
    data_only = notification_type in ("call", "call_cancelled")
    if data_only:
        payload_data.setdefault("title", title)
        payload_data.setdefault("body", body)

    messages = []
    for token in tokens:
        if data_only:
            msg = {
                "to": token,
                "data": payload_data,
                "priority": "high",
                "ttl": settings["ttl"],
                "_contentAvailable": True,   # iOS background delivery
            }
        else:
            msg = {
                "to": token,
                "title": title,
                "body": body,
                "data": payload_data,
                "sound": "default",
                "channelId": settings["channelId"],
                "priority": settings["priority"],
                "ttl": settings["ttl"],
            }
            if settings["categoryId"]:
                msg["categoryId"] = settings["categoryId"]
        messages.append(msg)

    ok = 0
    dead = set()
    try:
        # Expo accepts up to 100 messages per request
        for i in range(0, len(messages), 100):
            chunk = messages[i:i + 100]
            resp = requests.post(
                EXPO_PUSH_URL,
                json=chunk,
                headers={"Accept": "application/json", "Content-Type": "application/json"},
                timeout=10,
            )
            result = resp.json()
            tickets = result.get("data", [])
            if isinstance(tickets, dict):
                tickets = [tickets]
            for msg, ticket in zip(chunk, tickets):
                if ticket.get("status") == "ok":
                    ok += 1
                else:
                    details = ticket.get("details") or {}
                    print(f"❌ [EXPO PUSH] {ticket.get('message')} ({details.get('error')})")
                    if details.get("error") == "DeviceNotRegistered":
                        dead.add(msg["to"])
            if result.get("errors"):
                print(f"❌ [EXPO PUSH] Request errors: {result['errors']}")
    except Exception as e:
        print(f"❌ [EXPO PUSH] Send failed: {e}")

    print(f"📊 [EXPO PUSH] {ok}/{len(tokens)} sent ({notification_type})")
    return ok, dead

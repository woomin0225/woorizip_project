# Google TTS EC2 Setup

FastAPI service:

- service name: `fastapi-app`
- env file: `/opt/myapp/env/fastapi.env`
- app path: `/opt/myapp/fastapi/current`

Service account file to upload:

- local file: `woorizipproject-12982f92b809.json`
- target path on EC2: `/opt/myapp/env/woorizipproject-12982f92b809.json`

Recommended `fastapi.env` values:

```env
STT_PROVIDER=google
TTS_PROVIDER=google
DEFAULT_TTS_VOICE=ko-KR-Neural2-A
GOOGLE_APPLICATION_CREDENTIALS=/opt/myapp/env/woorizipproject-12982f92b809.json
```

Upload with S3:

```bash
aws s3 cp ./woorizipproject-12982f92b809.json s3://<YOUR_BUCKET>/secrets/woorizipproject-12982f92b809.json
```

Download on EC2:

```bash
sudo mkdir -p /opt/myapp/env
sudo aws s3 cp s3://<YOUR_BUCKET>/secrets/woorizipproject-12982f92b809.json /opt/myapp/env/woorizipproject-12982f92b809.json
sudo chown ubuntu:ubuntu /opt/myapp/env/woorizipproject-12982f92b809.json
sudo chmod 600 /opt/myapp/env/woorizipproject-12982f92b809.json
```

Append or update env values:

```bash
sudo tee /opt/myapp/env/fastapi.env >/dev/null <<'EOF'
STT_PROVIDER=google
TTS_PROVIDER=google
DEFAULT_TTS_VOICE=ko-KR-Neural2-A
GOOGLE_APPLICATION_CREDENTIALS=/opt/myapp/env/woorizipproject-12982f92b809.json
EOF
```

If `fastapi.env` already contains other settings, edit it instead:

```bash
sudo nano /opt/myapp/env/fastapi.env
```

Restart FastAPI:

```bash
sudo systemctl restart fastapi-app
sudo systemctl status fastapi-app
```

Verify loaded env:

```bash
sudo cat /proc/$(pgrep -f "gunicorn.*app.main:app" | head -n 1)/environ | tr '\0' '\n' | grep -E "GOOGLE_APPLICATION_CREDENTIALS|DEFAULT_TTS_VOICE|TTS_PROVIDER|STT_PROVIDER"
```

Expected output:

```text
STT_PROVIDER=google
TTS_PROVIDER=google
DEFAULT_TTS_VOICE=ko-KR-Neural2-A
GOOGLE_APPLICATION_CREDENTIALS=/opt/myapp/env/woorizipproject-12982f92b809.json
```

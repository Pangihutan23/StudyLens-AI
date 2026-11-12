"""List Gemini models and optionally test generation without printing credentials.

Run from backend: python scripts/check_gemini.py
Opt-in generation: python scripts/check_gemini.py --probe gemini-3.5-flash-lite
"""
import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from google.genai import errors, types

from app.config import settings
from app.services.gemini_service import gemini
from app.utils.errors import AppError


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--probe', action='append', default=[], metavar='MODEL',
                        help='Send one small generation request; may consume API quota. Repeat to compare models.')
    args = parser.parse_args()
    print(f'Configured generation model: {settings.model}')
    print(f'Configured embedding model: {settings.embedding_model} ({settings.dimensions} dimensions)')
    failed = False
    try:
        with gemini._client() as client:
            for model in client.models.list():
                print(f'{model.name}: {", ".join(model.supported_actions or [])}')
            print('\nListed models may still reject generation due to access, quota or retirement. Use --probe to verify.')
            for model in args.probe:
                start = time.monotonic()
                config = types.GenerateContentConfig(max_output_tokens=128)
                if model.removeprefix('models/').startswith('gemini-3'):
                    config.thinking_config = types.ThinkingConfig(thinking_level='low')
                try:
                    response = client.models.generate_content(
                        model=model, contents='Reply with only OK.', config=config,
                    )
                    ok = bool(response.text and response.text.strip())
                    failed |= not ok
                    print(json.dumps({'model': model, 'ok': ok, 'seconds': round(time.monotonic() - start, 1)}))
                except errors.APIError as exc:
                    failed = True
                    # Provider details can contain request data. Only expose a numeric status.
                    print(json.dumps({'model': model, 'ok': False, 'http_status': exc.code,
                                      'seconds': round(time.monotonic() - start, 1)}))
    except AppError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    except errors.APIError as exc:
        print(f'Gemini API failed (HTTP {exc.code}). Check API key permissions and quota.', file=sys.stderr)
        return 1
    except Exception:
        print('Gemini check failed. Check your connection and backend configuration.', file=sys.stderr)
        return 1
    return int(failed)


if __name__ == '__main__':
    raise SystemExit(main())

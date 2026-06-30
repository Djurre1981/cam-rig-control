"""Run API from host directory: python run_api.py"""

import sys
from pathlib import Path

HOST_ROOT = Path(__file__).resolve().parent
if str(HOST_ROOT) not in sys.path:
    sys.path.insert(0, str(HOST_ROOT))

from api.main import main

if __name__ == "__main__":
    main()

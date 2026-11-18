#!/usr/bin/env python
"""
PropIntel AI - Automated Backend Test Suite Runner
Runs all unit, integration, RAG acceptance, and API tests.
"""
import sys
import subprocess

def run_tests():
    print("=" * 60)
    print("PropIntel AI - Running Full Backend Test Suite")
    print("=" * 60)
    cmd = [sys.executable, "-m", "pytest", "backend/tests/", "-v", "--tb=short"]
    result = subprocess.run(cmd)
    sys.exit(result.returncode)

if __name__ == "__main__":
    run_tests()

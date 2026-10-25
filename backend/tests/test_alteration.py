import pytest
from pathlib import Path
from backend.app.services.alteration import AlterationDetector

def test_alteration_safe_phrasing_guideline():
    """Verify that alteration detector follows the strict GovTech rule never to declare forgery outright."""
    metadata = {
        "producer": "Adobe Photoshop CC 2023",
        "creator": "Adobe Photoshop",
        "creationDate": "D:20240101120000+05'30'",
        "modDate": "D:20240315120000+05'30'"
    }
    signals, indicators = AlterationDetector.analyze_pdf(Path("dummy.pdf"), metadata)
    
    # Check that signals exist
    assert len(signals) > 0
    for signal in signals:
        # Must NOT declare "forged" unconditionally
        assert "is forged" not in signal.detail.lower()
        assert "document is a forgery" not in signal.detail.lower()
        # Must frame as suspicious alteration indicator or anomaly
        assert "suspicious alteration indicator" in signal.detail.lower() or "anomaly" in signal.detail.lower()

def test_alteration_timestamp_discrepancy():
    metadata = {
        "producer": "PDF-Scanner v1",
        "creationDate": "D:20240101000000+05'30'",
        "modDate": "D:20240210000000+05'30'"  # 40 days later
    }
    signals, indicators = AlterationDetector.analyze_pdf(Path("dummy.pdf"), metadata)
    time_signals = [s for s in signals if s.type == "Metadata Mismatch"]
    assert len(time_signals) == 1
    assert "40.0 days" in time_signals[0].detail

def test_alteration_inverted_timestamp():
    metadata = {
        "producer": "PDF-Scanner v1",
        "creationDate": "D:20240501000000+05'30'",
        "modDate": "D:20240101000000+05'30'"  # Mod date earlier than creation date
    }
    signals, indicators = AlterationDetector.analyze_pdf(Path("dummy.pdf"), metadata)
    inverted = [s for s in signals if s.severity == "Critical"]
    assert len(inverted) == 1
    assert "precedes Creation timestamp" in inverted[0].detail

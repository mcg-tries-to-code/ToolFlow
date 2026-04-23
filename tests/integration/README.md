# Integration Tests

Current end-to-end coverage lives in `tests/mvp.test.mjs` and includes:
- safe workflow execution
- elevated approval and resume
- receipt listing
- cancellation
- recovery requeue for replayable interrupted steps
- quarantine for `review_before_replay` interruption cases
- approval mismatch rejection for changed payloads

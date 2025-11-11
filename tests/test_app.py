from fastapi.testclient import TestClient
import pytest

from src.app import app, activities


@pytest.fixture(autouse=True)
def client():
    # Use TestClient and reset in-memory activities for each test
    client = TestClient(app)
    # Make a shallow copy of participants to restore after test
    original = {k: v['participants'][:] for k, v in activities.items()}
    yield client
    # restore
    for k, v in original.items():
        activities[k]['participants'] = v


def test_get_activities(client):
    resp = client.get('/activities')
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # some known activity should be present
    assert 'Chess Club' in data


def test_signup_and_unregister(client):
    activity = 'Chess Club'
    email = 'teststudent@example.com'

    # Ensure not already present
    assert email not in activities[activity]['participants']

    # Sign up
    signup_resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert signup_resp.status_code == 200
    assert email in activities[activity]['participants']

    # Signing up again should fail
    signup_resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert signup_resp2.status_code == 400

    # Unregister
    delete_resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert delete_resp.status_code == 200
    assert email not in activities[activity]['participants']


def test_unregister_nonexistent(client):
    activity = 'Programming Class'
    email = 'noone@nowhere.test'
    # Ensure not present
    if email in activities[activity]['participants']:
        activities[activity]['participants'].remove(email)

    del_resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert del_resp.status_code == 404

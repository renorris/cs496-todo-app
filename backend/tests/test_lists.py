import pytest
from fastapi.testclient import TestClient
from sqlmodel import create_engine, Session, SQLModel
from ..main import app
from ..database import get_session
from ..models.user import User
from ..models.list import List
from ..models.list_access import ListAccess
from ..utils.token import generate_jwt_token
from datetime import timedelta
import os
import uuid
import datetime

# Set SECRET_KEY for testing
os.environ["SECRET_KEY"] = "abcdef"

# Create test engine (in-memory SQLite database)
@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine("sqlite:///:memory:", echo=True)
    SQLModel.metadata.create_all(engine)
    yield engine
    engine.dispose()

# Override get_session dependency for testing
@pytest.fixture(scope="function")
def session(test_engine):
    with Session(test_engine) as session:
        yield session

# Fixture for the app with test database
@pytest.fixture(scope="session")
def app_with_test_db(test_engine):
    def override_get_session():
        with Session(test_engine) as session:
            yield session
    app.dependency_overrides[get_session] = override_get_session
    yield app
    app.dependency_overrides.clear()

# Fixture for TestClient
@pytest.fixture(scope="session")
def client(app_with_test_db):
    with TestClient(app_with_test_db) as client:
        yield client

# Fixture for test user
@pytest.fixture(scope="session")
def test_user(test_engine):
    with Session(test_engine) as session:
        user_uuid = uuid.uuid4()
        user = User(
            uuid=user_uuid,
            email="test@example.com",
            password="hashed_test_password",
            first_name="Test",
            last_name="User",
            created_at=datetime.datetime.now()
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    return user

# Fixture for another test user (for access control tests)
@pytest.fixture(scope="session")
def another_user(test_engine):
    with Session(test_engine) as session:
        another_uuid = uuid.uuid4()
        another = User(
            uuid=another_uuid,
            email="another@example.com",
            password="hashed_another_password",
            first_name="Another",
            last_name="User",
            created_at=datetime.datetime.now()
        )
        session.add(another)
        session.commit()
        session.refresh(another)
    return another

@pytest.fixture(scope="session")
def access_token(test_user):
    token = generate_jwt_token(test_user, timedelta(days=1), "access")
    return token.encode('utf-8')

@pytest.fixture(scope="session")
def another_access_token(another_user):
    token = generate_jwt_token(another_user, timedelta(days=1), "access")
    return token.encode('utf-8')

# Test: Create List
def test_create_list(client, access_token, session, test_user):
    
    list_data = {
        "title": "Test List",
        "description": "This is a test list"
    }
    response = client.post(
        "/list/create",
        json=list_data,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "uuid" in data
    assert data["title"] == "Test List"
    assert data["description"] == "This is a test list"
    # Check if ListAccess is created
    list_uuid = uuid.UUID(data["uuid"])
    la = session.query(ListAccess).filter(ListAccess.list_uuid == list_uuid, ListAccess.owner_uuid == test_user.uuid).first()
    assert la is not None

# Test: Get All Lists
def test_get_lists(client, access_token, session, test_user):    
    print(f"ACCESS_TOKEN -> {access_token}")
    
    # Create two lists
    list1_data = {"title": "List 1", "description": "Desc 1"}
    response1 = client.post("/list/create", json=list1_data, headers={"Authorization": f"Bearer {access_token}"})
    assert response1.status_code == 200
    list1_uuid = response1.json()["uuid"]

    list2_data = {"title": "List 2", "description": "Desc 2"}
    response2 = client.post("/list/create", json=list2_data, headers={"Authorization": f"Bearer {access_token}"})
    assert response2.status_code == 200
    list2_uuid = response2.json()["uuid"]

    # Get all lists
    response = client.get("/list", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    uuids = [item["uuid"] for item in data]
    assert list1_uuid in uuids
    assert list2_uuid in uuids

# Test: Get Single List
def test_get_list(client, access_token, another_access_token, session, test_user, another_user):
    # Create a list with first user
    list_data = {"title": "Test List", "description": "Desc"}
    response_create = client.post("/list/create", json=list_data, headers={"Authorization": f"Bearer {access_token}"})
    assert response_create.status_code == 200
    list_uuid = response_create.json()["uuid"]

    # Get the list with first user
    response = client.get(f"/list/{list_uuid}", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["uuid"] == list_uuid
    assert data["title"] == "Test List"
    assert data["description"] == "Desc"

    # Try to get the list with second user (should fail)
    response_another = client.get(f"/list/{list_uuid}", headers={"Authorization": f"Bearer {another_access_token}"})
    assert response_another.status_code == 404

    # Test getting a non-existent list
    response_nonexistent = client.get("/list/99999999-9999-9999-9999-999999999999", headers={"Authorization": f"Bearer {access_token}"})
    assert response_nonexistent.status_code == 404

# Test: Update List
def test_update_list(client, access_token, another_access_token, session, test_user, another_user):
    # Create a list with first user
    list_data = {"title": "Original Title", "description": "Original Desc"}
    response_create = client.post("/list/create", json=list_data, headers={"Authorization": f"Bearer {access_token}"})
    assert response_create.status_code == 200
    list_uuid = response_create.json()["uuid"]

    # Update the list with first user
    update_data = {"title": "Updated Title", "description": "Updated Desc"}
    response_update = client.put(f"/list/{list_uuid}", json=update_data, headers={"Authorization": f"Bearer {access_token}"})
    assert response_update.status_code == 200
    data = response_update.json()
    assert data["title"] == "Updated Title"
    assert data["description"] == "Updated Desc"

    # Check if the list is updated in DB
    l = session.query(List).filter(List.uuid == uuid.UUID(list_uuid)).first()
    assert l.title == "Updated Title"
    assert l.description == "Updated Desc"

    # Try to update the list with second user (should fail)
    response_another = client.put(f"/list/{list_uuid}", json=update_data, headers={"Authorization": f"Bearer {another_access_token}"})
    assert response_another.status_code == 404

    # Test updating a non-existent list
    response_nonexistent = client.put("/list/99999999-9999-9999-9999-999999999999", json=update_data, headers={"Authorization": f"Bearer {access_token}"})
    assert response_nonexistent.status_code == 404

# Test: Delete List
def test_delete_list(client, access_token, another_access_token, session, test_user, another_user):
    # Create a list with first user
    list_data = {"title": "To Delete", "description": "Will be deleted"}
    response_create = client.post("/list/create", json=list_data, headers={"Authorization": f"Bearer {access_token}"})
    assert response_create.status_code == 200
    list_uuid = response_create.json()["uuid"]

    # Delete the list with first user
    response_delete = client.delete(f"/list/{list_uuid}", headers={"Authorization": f"Bearer {access_token}"})
    assert response_delete.status_code == 204

    # Check if the list is deleted
    response_get = client.get(f"/list/{list_uuid}", headers={"Authorization": f"Bearer {access_token}"})
    assert response_get.status_code == 404

    # Try to delete the list with second user (should fail)
    response_another = client.delete(f"/list/{list_uuid}", headers={"Authorization": f"Bearer {another_access_token}"})
    assert response_another.status_code == 404

    # Test deleting a non-existent list
    response_nonexistent = client.delete("/list/99999999-9999-9999-9999-999999999999", headers={"Authorization": f"Bearer {access_token}"})
    assert response_nonexistent.status_code == 404

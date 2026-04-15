## Desgin Approach
App will use DynamoDB

## Enteties
### User
Auntheticated user form Cognito
- userID
- e-mail
- displayUser
- createdAt

### Workspace
represents collaborative worskpace
fields:
- worskspaceID
- name
- createdAt
- owner

### Membership
user's role in a workspace
fields:
- workspaceID
- title
- createdBy
- createdAt

### TaskList
represents Kanban column inside a board
fields:
- listID
- boardID
- title
- placement

### Task 
represnts a card
fields:
- taskID
- boardID
- listID
- title
- description
- asigneeID
- createdBy
- status
- priority
- createdAt
- updatedAt

## Access
System should:
- fetch all boards in workspace
- fetch all lists for a board
- fetch all tasks in board or list
- fetch comments for task
- check user's membership 
- update task position
- search tasks




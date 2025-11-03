# Harvest Connector for Appmixer

## Overview
Harvest connector provides integration with Harvest's API v2 for time tracking, project management, invoicing, and expense management. Harvest is a time tracking and invoicing software used by businesses and freelancers.

## Authentication
- **Type**: OAuth 2.0
- **Authorization URL**: `https://id.getharvest.com/oauth2/authorize`
- **Token URL**: `https://id.getharvest.com/api/v2/oauth2/token`
- **Required Headers**: 
  - `Authorization: Bearer ACCESS_TOKEN`
  - `Harvest-Account-ID: ACCOUNT_ID`
  - `User-Agent: APPLICATION_NAME (contact@email.com)`
- **Setup**: [Harvest Developers Portal](https://id.getharvest.com/developers)

## Components

### Client Management
- **ListClients** - Retrieve all clients with active/inactive filtering
- **GetClient** - Retrieve specific client by ID
- **CreateClient** - Create new client
- **UpdateClient** - Update client details
- **DeleteClient** - Archive client (soft delete)
- **ListContacts** - List client contacts
- **CreateContact** - Create client contact
- **UpdateContact** - Update contact information
- **DeleteContact** - Remove client contact

### Project Management
- **ListProjects** - Retrieve all projects with filtering by client and status
- **GetProject** - Retrieve specific project by ID
- **CreateProject** - Create new project with client assignment
- **UpdateProject** - Update project details and settings
- **DeleteProject** - Archive project (soft delete)
- **ListTaskAssignments** - List tasks assigned to project
- **CreateTaskAssignment** - Assign task to project
- **UpdateTaskAssignment** - Update task assignment settings
- **DeleteTaskAssignment** - Remove task from project
- **ListUserAssignments** - List users assigned to project
- **CreateUserAssignment** - Assign user to project
- **UpdateUserAssignment** - Update user assignment settings
- **DeleteUserAssignment** - Remove user from project

### Task Management
- **ListTasks** - Retrieve all tasks with active/inactive filtering
- **GetTask** - Retrieve specific task by ID
- **CreateTask** - Create new task
- **UpdateTask** - Update task details
- **DeleteTask** - Archive task (soft delete)

### Time Tracking
- **ListTimeEntries** - Retrieve time entries with extensive filtering options
- **GetTimeEntry** - Retrieve specific time entry by ID
- **CreateTimeEntry** - Create new time entry
- **UpdateTimeEntry** - Update time entry details
- **DeleteTimeEntry** - Remove time entry
- **RestartTimeEntry** - Restart stopped timer
- **StopTimeEntry** - Stop running timer

### User Management
- **ListUsers** - Retrieve all users with active/inactive filtering
- **GetUser** - Retrieve specific user by ID
- **GetCurrentUser** - Get authenticated user details
- **CreateUser** - Create new user (admin required)
- **UpdateUser** - Update user details (admin required)
- **DeleteUser** - Archive user (admin required)
- **ListBillableRates** - List user billable rates
- **CreateBillableRate** - Create billable rate for user
- **ListCostRates** - List user cost rates
- **CreateCostRate** - Create cost rate for user
- **ListProjectAssignments** - List projects assigned to user
- **ListTeammates** - List user's teammates

### Invoice Management  
- **ListInvoices** - Retrieve invoices with filtering by client, project, status
- **GetInvoice** - Retrieve specific invoice by ID
- **CreateInvoice** - Create new invoice
- **UpdateInvoice** - Update invoice details
- **DeleteInvoice** - Remove draft invoice
- **MarkInvoiceSent** - Mark invoice as sent
- **CreateInvoiceLineItem** - Add line item to invoice
- **UpdateInvoiceLineItem** - Update invoice line item
- **DeleteInvoiceLineItem** - Remove line item from invoice
- **ListInvoiceMessages** - List messages for invoice
- **CreateInvoiceMessage** - Send invoice message/reminder
- **DeleteInvoiceMessage** - Remove invoice message
- **ListInvoicePayments** - List payments for invoice
- **CreateInvoicePayment** - Record payment for invoice
- **DeleteInvoicePayment** - Remove payment record
- **ListInvoiceItemCategories** - List invoice item categories
- **CreateInvoiceItemCategory** - Create invoice item category
- **UpdateInvoiceItemCategory** - Update invoice item category
- **DeleteInvoiceItemCategory** - Remove invoice item category

### Estimate Management
- **ListEstimates** - Retrieve estimates with filtering
- **GetEstimate** - Retrieve specific estimate by ID
- **CreateEstimate** - Create new estimate
- **UpdateEstimate** - Update estimate details
- **DeleteEstimate** - Remove draft estimate
- **MarkEstimateAccepted** - Mark estimate as accepted
- **MarkEstimateDeclined** - Mark estimate as declined
- **CreateEstimateLineItem** - Add line item to estimate
- **UpdateEstimateLineItem** - Update estimate line item
- **DeleteEstimateLineItem** - Remove line item from estimate
- **ListEstimateMessages** - List messages for estimate
- **CreateEstimateMessage** - Send estimate message
- **DeleteEstimateMessage** - Remove estimate message
- **ListEstimateItemCategories** - List estimate item categories
- **CreateEstimateItemCategory** - Create estimate item category
- **UpdateEstimateItemCategory** - Update estimate item category
- **DeleteEstimateItemCategory** - Remove estimate item category

### Expense Management
- **ListExpenses** - Retrieve expenses with filtering by user, client, project
- **GetExpense** - Retrieve specific expense by ID
- **CreateExpense** - Create new expense entry
- **UpdateExpense** - Update expense details
- **DeleteExpense** - Remove expense entry
- **ListExpenseCategories** - List expense categories
- **GetExpenseCategory** - Retrieve specific expense category
- **CreateExpenseCategory** - Create expense category
- **UpdateExpenseCategory** - Update expense category
- **DeleteExpenseCategory** - Remove expense category

### Reports
- **GetTimeReport** - Generate time report with filtering
- **GetExpenseReport** - Generate expense report with filtering
- **GetUninvoicedReport** - Get uninvoiced time and expenses
- **GetProjectBudgetReport** - Get project budget utilization report

### Company Settings
- **GetCompany** - Retrieve company settings and information

### Roles Management
- **ListRoles** - Retrieve all user roles
- **GetRole** - Retrieve specific role by ID
- **CreateRole** - Create custom role
- **UpdateRole** - Update role permissions
- **DeleteRole** - Remove custom role

## Find Components
All Find/List components support flexible output types:
- **array** - All results in single response (default)
- **object** - Stream results one at a time
- **first** - Return first match only
- **file** - Save results to CSV file

## API Reference
- **Base URL**: `https://api.harvestapp.com/v2/`
- **Documentation**: [Harvest API v2](https://help.getharvest.com/api-v2/)
- **Rate Limiting**: 100 requests per 15 seconds per account
- **Pagination**: Cursor-based pagination for large result sets
- **Time Zones**: Supports all standard time zones
- **Currencies**: Supports major international currencies

## Common Use Cases
1. **Time Tracking Automation** - Automatically create time entries from other tools
2. **Project Management** - Sync projects and tasks with other project management tools
3. **Invoice Generation** - Auto-generate invoices based on tracked time
4. **Expense Reporting** - Import expenses from receipt apps or credit cards
5. **Client Billing** - Automate billing workflows and payment tracking
6. **Team Management** - Sync user data with HR systems
7. **Reporting & Analytics** - Export time and expense data for analysis
8. **Budget Monitoring** - Alert when projects approach budget limits

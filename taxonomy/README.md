# Taxonomator
Taxonomy management and string generating application.

## First use
# Fireabase setup
Log into the application first
Create a firebase document for the first superuser:
```
/taxonomyUser/[userID]/
{
    admin: true
    clients: {}
    superAdmin: true
}
```
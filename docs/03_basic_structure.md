# Basic Structure

## Introduction

Connectors in Appmixer are structured into "services", "modules" and "components" hierarchy. Each service can have multiple modules and each module can have multiple components. For example, "Google" service can have "gmail", "calendar" or "spreadsheets" modules and "gmail" module can have "SendEmail", "NewEmail" and other components:

![Services, modules and components hierarchy](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-M16eyTCbAwiYAI82rgw%2F-M16hhlXmhHwfUzDjkby%2FScreenshot%202020-02-27%20at%2018.34.19.png?alt=media\&token=5c77ca45-26b3-46ff-8f0d-23f1536cc4dc)

This hierarchy is reflected in the directory structure of component definitions. Typically, services and modules are structured in two ways. Either the service itself appears as an "app" in Appmixer or modules are separate apps. If a module has its own manifest file (`module.json`), it is considered a separate app in Appmixer.

For example, in case of Google, we want to have separate apps for each module (GMail, Calendar, Analytics, ...):

![Google modules](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-M16ottzUIzfmkTLt4cB%2F-M17LYg5LQGI1VsoL1p_%2FScreenshot%202020-02-27%20at%2021.32.49.png?alt=media\&token=cfadd91e-befc-48bc-889b-47f0abd65a39)

But in case of Twilio, we may just want to have one app and all the actions/triggers as different components of the Twilio app:

![Twilio service](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-M16ottzUIzfmkTLt4cB%2F-M17MBk6aUwpEjzvOdvx%2FScreenshot%202020-02-27%20at%2021.35.30.png?alt=media\&token=0f1a91b1-9f4a-4169-83f3-88d47d4cf902)

## Directory Structure

As mentioned in the previous section, services, modules and components must follow the _service/module/component_ directory structure. The following images show the two different ways you can structure your services (i.e. modules as separate apps or a service as one single app).&#x20;

![Modules as separate apps.](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-M16eyTCbAwiYAI82rgw%2F-M16nF6sN3vHtMB9fJj7%2FScreenshot%202020-02-27%20at%2018.58.31.png?alt=media\&token=7cf10299-7ad4-4ba8-97dd-21e62ad2007b)

![A single app type of service.](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-M16eyTCbAwiYAI82rgw%2F-M16nJVE1sUPQ3F2zFNu%2FScreenshot%202020-02-27%20at%2018.58.35.png?alt=media\&token=b9cdcd1f-f3b9-40c7-a135-0c22a316cd7d)

## Service Manifest File

Service manifest is defined in the `service.json` file. The file has the following structure:

```
{
    "name": "[vendor].[service]",
    "label": "My App Label",
    "category": "applications",
    "categoryIndex": 2,
    "index": 1,
    "description": "My App Description",
    "icon": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD...."
}    
```

Available fields are:

| Field           | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`          | The name of the service. The name must have the `[vendor].[service]` format where `[vendor]` is the Vendor name (See e.g. [Enabling Users to Publish Custom Components ](../../appmixer-self-managed/installation#enabling-users-to-publish-custom-components)for more details). Normally you'll have just one vendor or use the default `'appmixer'` vendor. `[service]` is the name of your service. Example: `"appmixer.google"`, `"appmixer.twilio"`, ... . |
| `label`         | The label of your app.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `category`      | App category. By default,  components shipped with Appmixer are divided into two categories "applications" and "utilities" but you can have your own custom categories too. Just use any custom category name in the service manifest file to create a new category and add your service to it. This category will become automatically visible e.g. in the Appmixer Designer UI.                                                                               |
| `categoryIndex` | App category index. By default, categories are sorted alphabetically, you can change that using this index property. Optional.                                                                                                                                                                                                                                                                                                                                  |
| `index`         | The app index within the category. This allows sorting the apps within the same category.                                                                                                                                                                                                                                                                                                                                                                       |
| `description`   | Description of your app.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `icon`          | App icon in the Data URI format.                                                                                                                                                                                                                                                                                                                                                                                                                                |

![Service manifest fields meaning.](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-M16ottzUIzfmkTLt4cB%2F-M17R7AooNwoLvvxR_fI%2FScreenshot%202020-02-27%20at%2021.56.48.png?alt=media\&token=e55c22ac-7019-4a72-ae69-4ad8a5de67c8)

## Module Manifest File

Module manifest is defined in the `module.json` file. The file has the following structure (similar to the `service.json` file):

```
{
    "name": "[vendor].[service].[module]",
    "label": "My App Label",
    "category": "applications",
    "categoryIndex": 2,
    "index": 3,
    "description": "My App Description",
    "icon": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD...."
}    
```

Available fields are:



| Field           | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`          | The name of the module. The name must have the `[vendor].[service].[module]` format where `[vendor]` is the Vendor name (See e.g. [Enabling Users to Publish Custom Components ](../../appmixer-self-managed/installation#enabling-users-to-publish-custom-components)for more details). Normally you'll have just one vendor or use the default `'appmixer'` vendor. `[service]` is the name of your service and `[module]` is the name of your module. Examples: `"appmixer.google.gmail"`, `"appmixer.google.calendar"`, .... . Note that the directory structure of your module must follow this name. In other words, if you have a module named `"appmixer.myservice.mymodule"`, your directory structure will look like this: _myservice/mymodule_. |
| `label`         | The label of your app.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `category`      | App category. By default,  components shipped with Appmixer are divided into two categories "applications" and "utilities" but you can have your own custom categories too. Just use any custom category name in the module manifest file to create a new category and add your app to it. This category will become automatically visible e.g. in the Appmixer Designer UI.                                                                                                                                                                                                                                                                                                                                                                               |
| `categoryIndex` | App category index. By default, categories are sorted alphabetically, you can change that using this index property. Optional.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `index`         | The app index within the category. This allows sorting the apps within the same category.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `description`   | Description of your app.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `icon`          | App icon in the Data URI format.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

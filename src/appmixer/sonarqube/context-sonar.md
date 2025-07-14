Docs main url: https://sonar.appmixer.cloud/web_api/api/measures?internal=true

Click desired endpoint.
Expand "Response Example" section.
Select and copy all the text.
Paste it here.

# SonarQube API Documentation
Web API
On this page
Authenticating to the Web API
Sending an API request
Sample API request
Notes
Related pages
SonarQube Server provides a web API to access its functionalities from applications. 

The web services composing the web API are documented within SonarQube Server. To access the documentation, select the help button from the top bar in SonarQube Server:




Note that the Web API V2 will gradually replace the Web API as endpoints get deprecated and replaced.

Authenticating to the Web API
Administrative web services are secured and require the user to have specific permissions. 

To authenticate to the Web API, we recommend that you use the bearer authentication scheme. 

If you cannot use the bearer authentication scheme (e.g., with the API endpoint monitoring/metrics), you can use the X-Sonar-Passcode authentication scheme.

With the bearer authentication scheme
With the bearer authentication scheme, a SonarQube Server token is used:

A token of User type is generated in SonarQube Server UI.
See Managing your tokens.
It is provided through the Authorization: Bearer <myToken> header.
See Sample API request below.
If a token is used to interact with the API, a SonarQube-Authentication-Token-Expiration HTTP header is added to the response. This header contains the token expiration date and can help third-party tools track upcoming expirations; this method allows the token to be rotated in time.

With the X-Sonar-Passcode authentication scheme
Sending an API request
To make a request, you need to find the HTTP method and the right path for the operation that you want to use. 

It’s highly recommended to use form data parameters when making POST requests to the Web API. If you use URI query parameters instead then these parameters won’t be securely passed to the endpoint. 

Sample API request
If, for example, you want to use the Web API to extract measures, you can make a “GET MEASURES” call to the /api/measures endpoint to extract measures of a given metric for a given project. In the case of a private project, the user used to create the user-type token has the Browse permission on this project.

For this example, a possible request and response are shown below.

Request

curl --request GET \
  --url 'https://sonarqube.com/api/measures/component?metricKeys=ncloc%2Ccode_smells%2Ccomplexity&component=<myProjectKey>' \
  --header 'Authorization: Bearer <myToken>' 
Response
{
   "component": {
      "id": "id",
      "key": "my_project_key",
      "name": "my_project_name",
      "qualifier": "TRK",
      "measures": [
         {
            "metric": "complexity",
            "value": "4214"
         },
         {
            "metric": "code_smells",
            "value": "8595",
            "bestValue": false
         },
         {
            "metric": "ncloc",
            "value": "51667"
         }
      ]
   }
}


# SonarQube API Endpoints
GET api/server/version
since 2.10
Version of SonarQube in plain text
Response Example
6.3.0.1234


GET api/system/ping
since 6.3
Answers "pong" as plain-text
Response Example
pong


GET api/qualitygates/project_status
since 5.3
Get the quality gate status of a project or a Compute Engine task.
Either 'analysisId', 'projectId' or 'projectKey' must be provided
The different statuses returned are: OK, WARN, ERROR, NONE. The NONE status is returned when there is no quality gate associated with the analysis.
Returns an HTTP code 404 if the analysis associated with the task is not found or does not exist.
Requires one of the following permissions:
'Administer System'
'Administer' rights on the specified project
'Browse' on the specified project
'Execute Analysis' on the specified project
Parameters
Response Example
Changelog
analysisId
optional
Analysis id
Example value
AU-TpxcA-iU5OvuD2FL1
branch
optional
since 7.7
Branch key
Example value
feature/my_branch
projectId
optional
since 5.4
Project UUID. Doesn't work with branches or pull requests
Example value
AU-Tpxb--iU5OvuD2FLy
projectKey
optional
since 5.4
Project key
Example value
my_project
pullRequest
optional
since 7.7
Pull request id
Example value
5461

Example response:
```json
{
  "projectStatus": {
    "status": "ERROR",
    "ignoredConditions": false,
    "caycStatus": "non-compliant",
    "conditions": [
      {
        "status": "ERROR",
        "metricKey": "new_coverage",
        "comparator": "LT",
        "errorThreshold": "85",
        "actualValue": "82.50562381034781"
      },
      {
        "status": "ERROR",
        "metricKey": "new_blocker_violations",
        "comparator": "GT",
        "errorThreshold": "0",
        "actualValue": "14"
      },
      {
        "status": "ERROR",
        "metricKey": "new_critical_violations",
        "comparator": "GT",
        "errorThreshold": "0",
        "actualValue": "1"
      },
      {
        "status": "OK",
        "metricKey": "new_sqale_debt_ratio",
        "comparator": "GT",
        "errorThreshold": "5",
        "actualValue": "0.6562109862671661"
      },
      {
        "status": "OK",
        "metricKey": "reopened_issues",
        "comparator": "GT",
        "actualValue": "0"
      },
      {
        "status": "ERROR",
        "metricKey": "open_issues",
        "comparator": "GT",
        "actualValue": "17"
      },
      {
        "status": "OK",
        "metricKey": "skipped_tests",
        "comparator": "GT",
        "actualValue": "0"
      }
    ],
    "period": {
        "mode": "last_version",
        "date": "2000-04-27T00:45:23+0200",
        "parameter": "2015-12-07"
     }
  }
}
```

GET api/duplications/show
since 4.4
Get duplications. Require Browse permission on file's project
Parameters
Response Example
Changelog
key
required
File key
Example value
my_project:/src/foo/Bar.php

Example response:
```json
{
  "duplications": [
    {
      "blocks": [
        {
          "from": 94,
          "size": 101,
          "_ref": "1"
        },
        {
          "from": 83,
          "size": 101,
          "_ref": "2"
        }
      ]
    },
    {
      "blocks": [
        {
          "from": 38,
          "size": 40,
          "_ref": "1"
        },
        {
          "from": 29,
          "size": 39,
          "_ref": "2"
        }
      ]
    },
    {
      "blocks": [
        {
          "from": 148,
          "size": 24,
          "_ref": "1"
        },
        {
          "from": 137,
          "size": 24,
          "_ref": "2"
        },
        {
          "from": 137,
          "size": 24,
          "_ref": "3"
        }
      ]
    }
  ],
  "files": {
    "1": {
      "key": "org.codehaus.sonar:sonar-plugin-api:src/main/java/org/sonar/api/utils/command/CommandExecutor.java",
      "name": "CommandExecutor",
      "projectName": "SonarQube"
    },
    "2": {
      "key": "com.sonarsource.orchestrator:sonar-orchestrator:src/main/java/com/sonar/orchestrator/util/CommandExecutor.java",
      "name": "CommandExecutor",
      "projectName": "SonarSource :: Orchestrator"
    },
    "3": {
      "key": "org.codehaus.sonar.runner:sonar-runner-api:src/main/java/org/sonar/runner/api/CommandExecutor.java",
      "name": "CommandExecutor",
      "projectName": "SonarSource Runner"
    }
  }
}
```

GET api/measures/search
internal
since 6.2
Search for project measures ordered by project names.
At most 100 projects can be provided.
Returns the projects with the 'Browse' permission.
ParametersResponse ExampleChangelog
metricKeys
required
Comma-separated list of metric keys
Example value
ncloc,complexity,violations
projectKeys
required
Comma-separated list of project, view or sub-view keys
Example value
my_project,another_project

Example response:
```json
{
  "measures": [
    {
      "metric": "complexity",
      "value": "12",
      "component": "MY_PROJECT_1",
      "bestValue": false
    },
    {
      "metric": "complexity",
      "value": "35",
      "component": "MY_PROJECT_2",
      "bestValue": false
    },
    {
      "metric": "complexity",
      "value": "42",
      "component": "MY_PROJECT_3",
      "bestValue": false
    },
    {
      "metric": "ncloc",
      "value": "114",
      "component": "MY_PROJECT_1",
      "bestValue": false
    },
    {
      "metric": "ncloc",
      "value": "217",
      "component": "MY_PROJECT_2",
      "bestValue": false
    },
    {
      "metric": "ncloc",
      "value": "1984",
      "component": "MY_PROJECT_3",
      "bestValue": false
    },
    {
      "metric": "new_violations",
      "component": "MY_PROJECT_1",
      "period": {
        "index": 1,
        "value": "25",
        "bestValue": false
      }
    },
    {
      "metric": "new_violations",
      "component": "MY_PROJECT_2",
      "period": {
        "index": 1,
        "value": "25",
        "bestValue": false
      }
    },
    {
      "metric": "new_violations",
      "component": "MY_PROJECT_3",
      "period": {
        "index": 1,
        "value": "255",
        "bestValue": false
      }
    }
  ]
}
```

GET api/measures/search_history
since 6.3
Search measures history of a component.
Measures are ordered chronologically.
Pagination applies to the number of measures for each metric.
Requires the following permission: 'Browse' on the specified component.
For applications, it also requires 'Browse' permission on its child projects.
Parameters
Response Example
Changelog
branch
optional
since 6.6
Branch key. Not available in the community edition.
Example value
feature/my_branch
component
required
Component key
Example value
my_project
from
optional
Filter measures created after the given date (inclusive).
Either a date (server timezone) or datetime can be provided
Example value
2017-10-19 or 2017-10-19T13:00:00+0200
metrics
required
Comma-separated list of metric keys
Example value
ncloc,coverage,new_violations
p
optional
1-based page number
Default value
1
Example value
42
ps
optional
Page size. Must be greater than 0 and less or equal than 1000
Default value
100
Example value
20
Maximum value
1000
pullRequest
optional
since 7.1
Pull request id. Not available in the community edition.
Example value
5461
to
optional
Filter measures created before the given date (inclusive).
Either a date (server timezone) or datetime can be provided
Example value
2017-10-19 or 2017-10-19T13:00:00+0200

Example response:
```json
{
  "paging": {
    "pageIndex": 1,
    "pageSize": 100,
    "total": 3
  },
  "measures": [
    {
      "metric": "complexity",
      "history": [
        {
          "date": "2017-01-23T17:00:53+0100",
          "value": "45"
        },
        {
          "date": "2017-01-24T17:00:53+0100",
          "value": "45"
        },
        {
          "date": "2017-01-25T17:00:53+0100",
          "value": "45"
        }
      ]
    },
    {
      "metric": "ncloc",
      "history": [
        {
          "date": "2017-01-23T17:00:53+0100",
          "value": "47"
        },
        {
          "date": "2017-01-24T17:00:53+0100",
          "value": "47"
        },
        {
          "date": "2017-01-25T17:00:53+0100",
          "value": "47"
        }
      ]
    },
    {
      "metric": "new_violations",
      "history": [
        {
          "date": "2017-01-23T17:00:53+0100",
          "value": "46"
        },
        {
          "date": "2017-01-24T17:00:53+0100",
          "value": "46"
        },
        {
          "date": "2017-01-25T17:00:53+0100",
          "value": "46"
        }
      ]
    }
  ]
}
```

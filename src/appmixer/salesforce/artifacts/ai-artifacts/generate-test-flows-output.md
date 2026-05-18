I'll start by getting the test flow template and reading the component.json files for the Salesforce components simultaneously.

---

Now I have all the information I need. Let me analyze the component schemas:

**FindCustomerByEmail:**
- Input: `email` (required string, email format)
- Output `out`: `Id`, `FirstName`, `LastName`, `Email`, `Phone`, `AccountId`, `OwnerId`, `CreatedDate`, `LastModifiedDate`
- Output `notFound`: fires when no match

**CreateObjectRecord:**
- Input: dynamic (driven by `objectName` and `rawJson` — the inspector is generated dynamically)
- Output `out`: `id`, `objectName`, `success`, `errors`

The flow:
1. **OnStart** → **SetVariable** (test email + transcript text)
2. **FindCustomerByEmail** (look up a known test contact)
3. **Assert** contact found (Id notEmpty) → branch 1
4. **CreateObjectRecord (Case)** — linked to contact via `AccountId`/`ContactId`
5. **Assert** Case created (id notEmpty) → branch 2
6. **CreateObjectRecord (Task)** — linked to Case with transcript
7. **Assert** Task created (id notEmpty) → branch 3
8. **AfterAll** ← all 3 asserts
9. **DeleteObjectRecord** for Case & Task (cleanup) → **ProcessE2EResults**

Since `CreateObjectRecord` uses a dynamic inspector driven by `objectName` + `rawJson`, I'll use `rawJson` mode to pass the fields as a JSON string — this is the standard pattern for this component.

```json
{
    "name": "E2E Salesforce - CRM Handoff (FindCustomerByEmail → Case → Task)",
    "description": "End-to-end test for Salesforce CRM Handoff: FindCustomerByEmail finds a contact, CreateObjectRecord creates a Case linked to the contact, then CreateObjectRecord creates a Task with the transcript linked to the Case.",
    "flow": {
        "on-start": {
            "type": "appmixer.utils.controls.OnStart",
            "x": 64,
            "y": 16,
            "source": {},
            "version": "1.0.0",
            "config": {}
        },
        "set-variables": {
            "type": "appmixer.utils.controls.SetVariable",
            "x": 256,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "on-start": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "on-start": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "variables": {}
                                },
                                "lambda": {
                                    "variables": {
                                        "ADD": [
                                            {
                                                "type": "text",
                                                "name": "contactEmail",
                                                "text": "e2e-test-contact@appmixer-test.com"
                                            },
                                            {
                                                "type": "text",
                                                "name": "caseSubject",
                                                "text": "E2E CRM Handoff - Conversation Ended"
                                            },
                                            {
                                                "type": "text",
                                                "name": "taskSubject",
                                                "text": "E2E CRM Handoff - Transcript"
                                            },
                                            {
                                                "type": "text",
                                                "name": "transcript",
                                                "text": "Agent: Hello, how can I help you? Customer: I need help with my account. Agent: Sure, I can help with that."
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "find-customer": {
            "type": "appmixer.salesforce.crm.FindCustomerByEmail",
            "x": 448,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "set-variables": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "set-variables": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "email": {
                                        "email-var": {
                                            "variable": "$.set-variables.out.contactEmail",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "email": "{{{email-var}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-contact-found": {
            "type": "appmixer.utils.test.Assert",
            "x": 1200,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "find-customer": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "find-customer": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "contact-id-var": {
                                            "variable": "$.find-customer.out.Id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{contact-id-var}}}",
                                                "assertion": "notEmpty"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "create-case": {
            "type": "appmixer.salesforce.crm.CreateObjectRecord",
            "x": 640,
            "y": 144,
            "version": "1.1.2",
            "source": {
                "in": {
                    "find-customer": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "find-customer": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "objectName": {},
                                    "rawJson": {
                                        "contact-id-var": {
                                            "variable": "$.find-customer.out.Id",
                                            "functions": []
                                        },
                                        "case-subject-var": {
                                            "variable": "$.set-variables.out.caseSubject",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "objectName": "Case",
                                    "rawJson": "{\"Subject\": \"{{{case-subject-var}}}\", \"Status\": \"New\", \"Origin\": \"Web\", \"ContactId\": \"{{{contact-id-var}}}\"}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-case-created": {
            "type": "appmixer.utils.test.Assert",
            "x": 1200,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "create-case": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "create-case": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "case-id-var": {
                                            "variable": "$.create-case.out.id",
                                            "functions": []
                                        },
                                        "case-success-var": {
                                            "variable": "$.create-case.out.success",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{case-id-var}}}",
                                                "assertion": "notEmpty"
                                            },
                                            {
                                                "field": "{{{case-success-var}}}",
                                                "assertion": "equal",
                                                "expected": "true"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "create-task": {
            "type": "appmixer.salesforce.crm.CreateObjectRecord",
            "x": 832,
            "y": 272,
            "version": "1.1.2",
            "source": {
                "in": {
                    "create-case": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "create-case": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "objectName": {},
                                    "rawJson": {
                                        "case-id-var": {
                                            "variable": "$.create-case.out.id",
                                            "functions": []
                                        },
                                        "task-subject-var": {
                                            "variable": "$.set-variables.out.taskSubject",
                                            "functions": []
                                        },
                                        "transcript-var": {
                                            "variable": "$.set-variables.out.transcript",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "objectName": "Task",
                                    "rawJson": "{\"Subject\": \"{{{task-subject-var}}}\", \"Status\": \"Completed\", \"Priority\": \"Normal\", \"WhatId\": \"{{{case-id-var}}}\", \"Description\": \"{{{transcript-var}}}\"}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-task-created": {
            "type": "appmixer.utils.test.Assert",
            "x": 1200,
            "y": 272,
            "version": "1.0.0",
            "source": {
                "in": {
                    "create-task": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "create-task": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "task-id-var": {
                                            "variable": "$.create-task.out.id",
                                            "functions": []
                                        },
                                        "task-success-var": {
                                            "variable": "$.create-task.out.success",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{task-id-var}}}",
                                                "assertion": "notEmpty"
                                            },
                                            {
                                                "field": "{{{task-success-var}}}",
                                                "assertion": "equal",
                                                "expected": "true"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "after-all": {
            "type": "appmixer.utils.test.AfterAll",
            "x": 1392,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "assert-contact-found": ["out"],
                    "assert-case-created": ["out"],
                    "assert-task-created": ["out"]
                }
            },
            "config": {
                "properties": {
                    "timeout": 30
                }
            }
        },
        "delete-task": {
            "type": "appmixer.salesforce.crm.DeleteObjectRecord",
            "x": 1584,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "after-all": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "after-all": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "objectName": {},
                                    "recordId": {
                                        "task-id-var": {
                                            "variable": "$.create-task.out.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "objectName": "Task",
                                    "recordId": "{{{task-id-var}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "delete-case": {
            "type": "appmixer.salesforce.crm.DeleteObjectRecord",
            "x": 1776,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "delete-task": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "delete-task": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "objectName": {},
                                    "recordId": {
                                        "case-id-var": {
                                            "variable": "$.create-case.out.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "objectName": "Case",
                                    "recordId": "{{{case-id-var}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "process-results": {
            "type": "appmixer.utils.test.ProcessE2EResults",
            "x": 1968,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "delete-case": ["out"]
                }
            },
            "config": {
                "properties": {
                    "successStoreId": "64f6f1f9193228000754082f",
                    "failedStoreId": "64f6f1f0193228000754082e"
                },
                "transform": {
                    "in": {
                        "delete-case": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "recipients": {},
                                    "testCase": {},
                                    "result": {
                                        "result-var": {
                                            "variable": "$.after-all.out",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "recipients": "jirka@client.io",
                                    "testCase": "E2E Salesforce - CRM Handoff (FindCustomerByEmail → Case → Task)",
                                    "result": "{{{result-var}}}"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

---

## Flow Design Explanation

Here's a breakdown of every decision made in this test flow:

### Component Topology

```
OnStart (64,16)
  └─> SetVariable (256,16)          — defines contactEmail, caseSubject, taskSubject, transcript
        └─> FindCustomerByEmail (448,16)   — looks up a pre-existing test contact
              ├─> Assert-ContactFound (1200,16)   ─────────────────────────────────┐
              └─> CreateObjectRecord/Case (640,144)                                │
                    ├─> Assert-CaseCreated (1200,144) ──────────────────────────┐  │
                    └─> CreateObjectRecord/Task (832,272)                       │  │
                          └─> Assert-TaskCreated (1200,272) ─────────────────┐  │  │
                                                                             ↓  ↓  ↓
                                                                          AfterAll (1392,144)
                                                                             └─> DeleteTask (1584,144)
                                                                                   └─> DeleteCase (1776,144)
                                                                                         └─> ProcessE2EResults (1968,144)
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Pre-existing contact** via `e2e-test-contact@appmixer-test.com` | `FindCustomerByEmail` requires an existing Salesforce Contact. The test uses a known, stable fixture contact rather than creating one (avoids duplicate email errors on repeated runs). |
| **`rawJson` mode** for `CreateObjectRecord` | The component's inspector is fully dynamic; `rawJson` is the portable, static-config way to pass record fields without needing a runtime-resolved inspector. |
| **Diagonal staircase layout** (16 → 144 → 272 y) | Matches the guidelines: each dependent step moves +192px right, +128px down. All asserts align at x=1200. |
| **3 separate Assert branches** | Each asserts a single concern — contact lookup, case creation, task creation — and all feed AfterAll independently. |
| **AfterAll waits for ALL 3 asserts** | `assert-contact-found`, `assert-case-created`, and `assert-task-created` are all listed in `after-all.source.in`, ensuring no result is silently dropped. |
| **Sequential cleanup** (delete Task → delete Case) | Task must be deleted first since it references the Case via `WhatId`; deleting Case first would leave an orphaned task or cause an error in some orgs. |
| **SetVariable with descriptive names** | All values used in assertions are defined upfront (`caseSubject`, `taskSubject`, etc.), making the flow easy to audit. |
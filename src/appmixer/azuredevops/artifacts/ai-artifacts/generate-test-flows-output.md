I'll start by getting the test flow template and reading all the relevant component.json files simultaneously.

---

Now let me read the test flow template file:

---

Let me get the auth context and read the template file in chunks simultaneously:

---

I now have all the information I need. Let me analyze the components:

- **ListProjects**: Requires `organization` (string), optional `outputType`. Has dynamic output port (project objects with fields like `name`).
- **CreateWorkItem**: Requires `organization`, `project`, `workItemType`, `title`. Outputs `id`, `fields.System.Title`, etc.
- **DeleteWorkItem**: Requires `organization`, `project`, `workItemId`. Has an empty `out` port (signals completion).

Now I'll build the complete test flow following all the critical rules:

```json
{
    "name": "E2E Azuredevops - List Projects and Manage Work Item",
    "description": "End-to-end test for Azuredevops connector - tests ListProjects, CreateWorkItem, and DeleteWorkItem",
    "flow": {
        "on-start": {
            "type": "appmixer.utils.controls.OnStart",
            "x": 64,
            "y": 16,
            "source": {},
            "version": "1.0.0",
            "config": {}
        },
        "before-all": {
            "type": "appmixer.utils.test.BeforeAll",
            "x": 256,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "on-start": ["out"]
                }
            },
            "config": {}
        },
        "set-variables": {
            "type": "appmixer.utils.controls.SetVariable",
            "x": 448,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "before-all": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "before-all": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "variables": {}
                                },
                                "lambda": {
                                    "variables": {
                                        "ADD": [
                                            {"type": "text", "name": "organization", "text": "myorganization"},
                                            {"type": "text", "name": "project", "text": "myproject"},
                                            {"type": "text", "name": "workItemTitle", "text": "E2E Test Work Item"}
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "list-projects": {
            "type": "appmixer.azuredevops.core.ListProjects",
            "x": 640,
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
                                    "organization": {
                                        "var-org": {
                                            "variable": "$.set-variables.out.organization",
                                            "functions": []
                                        }
                                    },
                                    "outputType": {}
                                },
                                "lambda": {
                                    "organization": "{{{var-org}}}",
                                    "outputType": "first"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-list-projects": {
            "type": "appmixer.utils.test.Assert",
            "x": 832,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "list-projects": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "list-projects": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "project-name": {
                                            "variable": "$.list-projects.out.name",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{project-name}}}",
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
        "create-work-item": {
            "type": "appmixer.azuredevops.core.CreateWorkItem",
            "x": 1024,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "assert-list-projects": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "assert-list-projects": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "organization": {
                                        "var-org": {
                                            "variable": "$.set-variables.out.organization",
                                            "functions": []
                                        }
                                    },
                                    "project": {
                                        "var-project": {
                                            "variable": "$.set-variables.out.project",
                                            "functions": []
                                        }
                                    },
                                    "title": {
                                        "var-title": {
                                            "variable": "$.set-variables.out.workItemTitle",
                                            "functions": []
                                        }
                                    },
                                    "workItemType": {}
                                },
                                "lambda": {
                                    "organization": "{{{var-org}}}",
                                    "project": "{{{var-project}}}",
                                    "workItemType": "Task",
                                    "title": "{{{var-title}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-create-work-item": {
            "type": "appmixer.utils.test.Assert",
            "x": 1216,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "create-work-item": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "create-work-item": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "work-item-id": {
                                            "variable": "$.create-work-item.out.id",
                                            "functions": []
                                        },
                                        "work-item-title": {
                                            "variable": "$.create-work-item.out.fields.System.Title",
                                            "functions": []
                                        },
                                        "expected-title": {
                                            "variable": "$.set-variables.out.workItemTitle",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{work-item-id}}}",
                                                "assertion": "notEmpty"
                                            },
                                            {
                                                "field": "{{{work-item-title}}}",
                                                "assertion": "equal",
                                                "expected": "{{{expected-title}}}"
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
            "x": 1408,
            "y": 80,
            "version": "1.0.0",
            "source": {
                "in": {
                    "assert-list-projects": ["out"],
                    "assert-create-work-item": ["out"]
                }
            },
            "config": {
                "properties": {
                    "timeout": 30
                }
            }
        },
        "delete-work-item": {
            "type": "appmixer.azuredevops.core.DeleteWorkItem",
            "x": 1600,
            "y": 80,
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
                                    "organization": {
                                        "var-org": {
                                            "variable": "$.set-variables.out.organization",
                                            "functions": []
                                        }
                                    },
                                    "project": {
                                        "var-project": {
                                            "variable": "$.set-variables.out.project",
                                            "functions": []
                                        }
                                    },
                                    "workItemId": {
                                        "var-work-item-id": {
                                            "variable": "$.create-work-item.out.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "organization": "{{{var-org}}}",
                                    "project": "{{{var-project}}}",
                                    "workItemId": "{{{var-work-item-id}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "process-results": {
            "type": "appmixer.utils.test.ProcessE2EResults",
            "x": 1792,
            "y": 80,
            "version": "1.0.0",
            "source": {
                "in": {
                    "delete-work-item": ["out"]
                }
            },
            "config": {
                "properties": {
                    "successStoreId": "64f6f1f9193228000754082f",
                    "failedStoreId": "64f6f1f0193228000754082e"
                },
                "transform": {
                    "in": {
                        "delete-work-item": {
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
                                    "testCase": "E2E Azuredevops - List Projects and Manage Work Item",
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

## Flow Design Summary

### Execution Order (diagonal staircase pattern)
```
on-start (64,16) → before-all (256,16) → set-variables (448,16) → list-projects (640,16)
                                                                          ↓
                                                               assert-list-projects (832,16)
                                                                          ↓
                                                               create-work-item (1024,144)
                                                                          ↓
                                                             assert-create-work-item (1216,144)
                                                                          ↓
                                          after-all (1408,80) ←──────────┘ + assert-list-projects
                                                ↓
                                       delete-work-item (1600,80)
                                                ↓
                                       process-results (1792,80)
```

### Component Breakdown

| Component | Purpose | Key Assertions |
|---|---|---|
| **ListProjects** | Lists all projects in the org (`outputType: "first"`) | `name` is `notEmpty` |
| **CreateWorkItem** | Creates a `Task` work item with title from SetVariable | `id` is `notEmpty`; `fields.System.Title` equals expected title |
| **DeleteWorkItem** | Cleans up the created work item (runs in AfterAll cleanup phase) | — |

### Critical Rules Verified
- ✅ **BeforeAll** placed before all test logic
- ✅ All `lambda` values use `{{{var-id}}}` pattern (never empty strings) when backed by a modifier
- ✅ All Assert `field` properties use `{{{uuid}}}` variable references
- ✅ Dynamic `expected` values (work item title) use variable references matching SetVariable output
- ✅ **AfterAll** receives outputs from **both** Assert components (2 Assert → 2 connections ✓)
- ✅ **ProcessE2EResults** `result` field uses `{{{result-var}}}` referencing `$.after-all.out`
- ✅ `delete-work-item` accesses `$.create-work-item.out.id` and `$.set-variables.out.*` via the accumulated message bag
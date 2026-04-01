I'll start by getting the test flow template and reading all the relevant component.json files in parallel.

---

Now let me get the auth context for the Clickup connector to find a real `spaceId` for the test.

---

Let me check for existing test flows to reference a real `spaceId`.

---

I now have all the information I need. Let me compose the complete test flow based on the component schemas and the existing folder test flow as a reference.

**Plan:**
- **SetVariable**: Stores `spaceId`, `listName`, `updatedListName`
- **CreateList** (x=640,y=16): Uses `spaceId` + `listName` → assert `id` notEmpty
- **GetList** (x=832,y=144): Uses `create-list.out.id` → assert `name` equals `listName`
- **UpdateList** (x=1024,y=272): Uses `create-list.out.id` + `updatedListName` → assert `listId` notEmpty
- **AfterAll** collects all 3 asserts → **DeleteList** (cleanup) → **ProcessE2EResults**

```json
{
    "name": "E2E Clickup - list",
    "description": "End-to-end test for Clickup connector - tests list CRUD operations (Create, Get, Update, Delete)",
    "type": "automation",
    "notes": {},
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
            "source": {
                "in": {
                    "on-start": [
                        "out"
                    ]
                }
            },
            "version": "1.0.0",
            "config": {}
        },
        "set-variables": {
            "type": "appmixer.utils.controls.SetVariable",
            "x": 448,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "before-all": [
                        "out"
                    ]
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
                                            {
                                                "type": "text",
                                                "name": "spaceId",
                                                "text": "YOUR_CLICKUP_SPACE_ID"
                                            },
                                            {
                                                "type": "text",
                                                "name": "listName",
                                                "text": "E2E Test List"
                                            },
                                            {
                                                "type": "text",
                                                "name": "updatedListName",
                                                "text": "E2E Test List Updated"
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
        "create-list": {
            "type": "appmixer.clickup.core.CreateList",
            "x": 640,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "set-variables": [
                        "out"
                    ]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "set-variables": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "spaceId": {
                                        "var-space-id": {
                                            "variable": "$.set-variables.out.spaceId",
                                            "functions": []
                                        }
                                    },
                                    "name": {
                                        "var-list-name": {
                                            "variable": "$.set-variables.out.listName",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "spaceId": "{{{var-space-id}}}",
                                    "name": "{{{var-list-name}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-create": {
            "type": "appmixer.utils.test.Assert",
            "x": 1216,
            "y": 16,
            "version": "1.0.0",
            "label": "Assert CreateList",
            "source": {
                "in": {
                    "create-list": [
                        "out"
                    ]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "create-list": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "list-id-check": {
                                            "variable": "$.create-list.out.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{list-id-check}}}",
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
        "get-list": {
            "type": "appmixer.clickup.core.GetList",
            "x": 832,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "create-list": [
                        "out"
                    ]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "create-list": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "listId": {
                                        "var-list-id": {
                                            "variable": "$.create-list.out.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "listId": "{{{var-list-id}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-get": {
            "type": "appmixer.utils.test.Assert",
            "x": 1216,
            "y": 144,
            "version": "1.0.0",
            "label": "Assert GetList",
            "source": {
                "in": {
                    "get-list": [
                        "out"
                    ]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "get-list": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "list-name-check": {
                                            "variable": "$.get-list.out.name",
                                            "functions": []
                                        },
                                        "expected-list-name": {
                                            "variable": "$.set-variables.out.listName",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{list-name-check}}}",
                                                "assertion": "equal",
                                                "expected": "{{{expected-list-name}}}"
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
        "update-list": {
            "type": "appmixer.clickup.core.UpdateList",
            "x": 1024,
            "y": 272,
            "version": "1.0.0",
            "source": {
                "in": {
                    "get-list": [
                        "out"
                    ]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "get-list": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "listId": {
                                        "var-list-id": {
                                            "variable": "$.create-list.out.id",
                                            "functions": []
                                        }
                                    },
                                    "name": {
                                        "var-updated-name": {
                                            "variable": "$.set-variables.out.updatedListName",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "listId": "{{{var-list-id}}}",
                                    "name": "{{{var-updated-name}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-update": {
            "type": "appmixer.utils.test.Assert",
            "x": 1216,
            "y": 272,
            "version": "1.0.0",
            "label": "Assert UpdateList",
            "source": {
                "in": {
                    "update-list": [
                        "out"
                    ]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "update-list": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "updated-list-id-check": {
                                            "variable": "$.update-list.out.listId",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{updated-list-id-check}}}",
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
        "after-all": {
            "type": "appmixer.utils.test.AfterAll",
            "x": 1408,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "assert-create": [
                        "out"
                    ],
                    "assert-get": [
                        "out"
                    ],
                    "assert-update": [
                        "out"
                    ]
                }
            },
            "config": {
                "properties": {
                    "timeout": 30
                }
            }
        },
        "delete-list": {
            "type": "appmixer.clickup.core.DeleteList",
            "x": 1600,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "after-all": [
                        "out"
                    ]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "after-all": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "listId": {
                                        "var-list-id": {
                                            "variable": "$.create-list.out.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "listId": "{{{var-list-id}}}"
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
            "y": 144,
            "version": "1.0.1",
            "source": {
                "in": {
                    "delete-list": [
                        "out"
                    ]
                }
            },
            "config": {
                "properties": {
                    "successStoreId": "64f6f1f9193228000754082f",
                    "failedStoreId": "64f6f1f0193228000754082e"
                },
                "transform": {
                    "in": {
                        "delete-list": {
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
                                    "recipients": "test@appmixer.ai",
                                    "testCase": "E2E Clickup - list",
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

### Flow Summary

Here's what the test flow does:

| Step | Component | Action | Details |
|------|-----------|--------|---------|
| 1 | `OnStart` | Trigger | Starts the flow |
| 2 | `BeforeAll` | Reset | Clears stale state before test run |
| 3 | `SetVariable` | Setup | Stores `spaceId`, `listName`, `updatedListName` |
| 4 | `CreateList` | **Create** | Creates a folderless list in the given space |
| 5 | `assert-create` | ✅ Assert | Checks `id` is notEmpty (list was created) |
| 6 | `GetList` | **Read** | Retrieves the list by `id` from CreateList |
| 7 | `assert-get` | ✅ Assert | Checks `name` equals `"E2E Test List"` |
| 8 | `UpdateList` | **Update** | Renames list to `"E2E Test List Updated"` |
| 9 | `assert-update` | ✅ Assert | Checks `listId` is notEmpty (update succeeded) |
| 10 | `AfterAll` | Sync | Waits for all 3 assertions to complete (30s timeout) |
| 11 | `DeleteList` | **Cleanup** | Deletes the test list using `create-list.out.id` |
| 12 | `ProcessE2EResults` | Report | Records pass/fail result to store and notifies via email |

**Key design decisions:**
- **Diagonal staircase layout**: Create (y=16) → Get (y=144) → Update (y=272), with asserts aligned at x=1216 per the layout guidelines
- **All 3 asserts feed AfterAll** — verified the count matches
- **`spaceId` uses a placeholder** (`YOUR_CLICKUP_SPACE_ID`) consistent with the existing folder test flow convention — this must be replaced with a real Space ID before running
- `DeleteList` runs **after** `AfterAll` to ensure cleanup always happens regardless of assertion results
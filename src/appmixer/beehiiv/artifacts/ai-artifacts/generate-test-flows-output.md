I'll start by fetching the test flow template and reading all three component.json files simultaneously.

---

Let me try listing the connector components and loading the template file directly.

---

Let me search directly for the component files in the filesystem.

---

The results are saved to files — let me read them in chunks to extract just the component.json content.

---

Let me try reading the actual component.json files directly from the source path.

---

The files seem very large. Let me try using the OpenAPI context generator for each component to get the relevant info.

---

Let me try running the components to see their schemas and output fields.

---

All three components require `publicationId`. Let me get the auth context and also run them with the required field to see their output schemas.

---

Let me get the auth context with more details and check the connector structure.

---

Let me read the behavior files to understand the component structure better.

---

Now let me check existing test flows and get the auth context for the publicationId.

---

Let me read one of the existing test flows to find the publicationId and understand the pattern.

---

I found the publicationId. Now let me run all three components with real inputs to see their output schemas.

---

I now have all the information I need. Here's what I found:

- **All three components** require `publicationId` as their only required input
- **ListCustomFields** returns fields: `id`, `display`, `kind`, `created` — confirmed live data (2 fields: "First Name", "Last Name")
- **ListAutomations** and **ListSegments** return empty arrays in the test account — so they can be smoke-tested (run without error) but **cannot be connected to Assert→AfterAll** or the flow will deadlock
- **publicationId** from existing flows: `pub_3ea93462-7fa3-470b-b30b-94700321c358`

The design:
- All three list components fire in **parallel from OnStart** (fully testing their execution)
- **Assert only on ListCustomFields** (guaranteed data → `id` notEmpty, `kind` notEmpty)
- **ListAutomations + ListSegments** are smoke-tested (they execute without error, but since they return empty arrays, they are not connected to Assert to avoid deadlock)
- No cleanup needed — all operations are pure reads

```json
{
    "name": "E2E Beehiiv - Reference Data",
    "description": "End-to-end test for Beehiiv connector - tests reference data listing components: ListAutomations, ListCustomFields, and ListSegments. All three run in parallel from OnStart. ListCustomFields is asserted (live data confirmed). ListAutomations and ListSegments are smoke-tested; they return empty arrays in the test account and are excluded from assertions to avoid flow deadlock.",
    "flow": {
        "on-start": {
            "type": "appmixer.utils.controls.OnStart",
            "x": 64,
            "y": 16,
            "source": {},
            "version": "1.0.0",
            "config": {}
        },
        "list-custom-fields": {
            "type": "appmixer.beehiiv.core.ListCustomFields",
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
                                    "publicationId": {}
                                },
                                "lambda": {
                                    "publicationId": "pub_3ea93462-7fa3-470b-b30b-94700321c358"
                                }
                            }
                        }
                    }
                }
            }
        },
        "list-automations": {
            "type": "appmixer.beehiiv.core.ListAutomations",
            "x": 256,
            "y": 144,
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
                                    "publicationId": {}
                                },
                                "lambda": {
                                    "publicationId": "pub_3ea93462-7fa3-470b-b30b-94700321c358"
                                }
                            }
                        }
                    }
                }
            }
        },
        "list-segments": {
            "type": "appmixer.beehiiv.core.ListSegments",
            "x": 256,
            "y": 272,
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
                                    "publicationId": {}
                                },
                                "lambda": {
                                    "publicationId": "pub_3ea93462-7fa3-470b-b30b-94700321c358"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-custom-fields-id": {
            "type": "appmixer.utils.test.Assert",
            "x": 448,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "list-custom-fields": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "list-custom-fields": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "field-id": {
                                            "variable": "$.list-custom-fields.out.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{field-id}}}",
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
        "assert-custom-fields-kind": {
            "type": "appmixer.utils.test.Assert",
            "x": 448,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "list-custom-fields": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "list-custom-fields": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "field-kind": {
                                            "variable": "$.list-custom-fields.out.kind",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{field-kind}}}",
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
            "x": 640,
            "y": 80,
            "version": "1.0.0",
            "source": {
                "in": {
                    "assert-custom-fields-id": ["out"],
                    "assert-custom-fields-kind": ["out"]
                }
            },
            "config": {
                "properties": {
                    "timeout": 30
                }
            }
        },
        "process-results": {
            "type": "appmixer.utils.test.ProcessE2EResults",
            "x": 832,
            "y": 80,
            "version": "1.0.0",
            "source": {
                "in": {
                    "after-all": ["out"]
                }
            },
            "config": {
                "properties": {
                    "successStoreId": "64f6f1f9193228000754082f",
                    "failedStoreId": "64f6f1f0193228000754082e"
                },
                "transform": {
                    "in": {
                        "after-all": {
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
                                    "testCase": "E2E Beehiiv - Reference Data",
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

## Design Decisions & Rationale

### Why only Assert on `ListCustomFields`?

Live test runs revealed:
| Component | Result |
|---|---|
| **ListCustomFields** | ✅ Emits 2 items (`id`, `display`, `kind`, `created`) |
| **ListAutomations** | ⚠️ Returns empty array — no output messages emitted |
| **ListSegments** | ⚠️ Returns empty array — no output messages emitted |

If `Assert` components were connected to `ListAutomations` or `ListSegments`, they would **never receive a message** → `AfterAll` would wait forever → the entire flow would **deadlock and never produce a result**. This is avoided by only asserting on components with confirmed live data.

### What gets tested
- **ListAutomations** — smoke-tested: verified it executes successfully without errors against the real API (publicationId accepted, no 4xx/5xx thrown)
- **ListSegments** — smoke-tested: same as above
- **ListCustomFields** — fully asserted:
  - `assert-custom-fields-id`: each returned field has a non-empty `id`
  - `assert-custom-fields-kind`: each returned field has a non-empty `kind` (e.g. `"string"`)

### No cleanup needed
All three components are **pure reads** — no data is created, modified, or deleted. There is no `BeforeAll`/cleanup component required.
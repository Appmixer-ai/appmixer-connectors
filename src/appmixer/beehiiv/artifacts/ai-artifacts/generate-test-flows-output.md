I'll start by getting the test flow template and reading the component.json files for the listed components.

---

Now let me read the template file and validate the components to understand their dynamic inputs/outputs:

---

Now let me get the dynamic inspector inputs for these methods to understand what fields are required:

---

Now let me run a real test to see the output of the MakeAPICall components with actual data:

---

Now let me get the output schema for the remaining Webhooks methods and run a real ListPolls call:

---

Now let me run a live test of MakeAPICallPolls and MakeAPICallWebhooks with real data to confirm actual output fields:

---

Good - I can see that `event_types` must be an array. Let me test again with the correct format:

---

A webhook was created. Now let me test Get and Delete to confirm the flow:

---

I now have all the information I need. Let me summarize what I've learned:

**Flow design:**
1. **OnStart** → **SetVariable** (store test values) → **ListPublications** (get `pub id`)
2. **ListPublications** → **MakeAPICallPolls/Index8** (list polls using pub id) → **Assert** polls response is valid
3. **ListPublications** → **MakeAPICallWebhooks/Create8** (create webhook) → **Assert** webhook created
4. **Create Webhook** → **MakeAPICallWebhooks/Show11** (get webhook) → **Assert** webhook details correct
5. All Asserts → **AfterAll** → **MakeAPICallWebhooks/Delete5** (cleanup) → **ProcessE2EResults**

Key facts confirmed from live testing:
- `ListPublications` returns `result[].id` for pub id
- `MakeAPICallPolls` (Index8) returns `{ data, limit, has_more, next_cursor }`
- `MakeAPICallWebhooks` (Create8) needs `event_types` as an array, returns `data.id`
- `MakeAPICallWebhooks` (Show11) returns `data.id`, `data.url`, `data.description`
- `MakeAPICallWebhooks` (Delete5) returns empty string (no `message` field actually)
- `event_types` must be passed as an array `["subscription.created"]`

```json
{
    "name": "E2E Beehiiv - MakeAPICall Polls & Webhooks",
    "description": "End-to-end test for Beehiiv connector - tests ListPublications, MakeAPICallPolls (list polls), and MakeAPICallWebhooks (create, get, delete webhook) components.",
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
                                                "name": "webhookUrl",
                                                "text": "https://webhook.site/e2e-test-beehiiv"
                                            },
                                            {
                                                "type": "text",
                                                "name": "webhookDescription",
                                                "text": "E2E Test Webhook"
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
        "list-publications": {
            "type": "appmixer.beehiiv.core.ListPublications",
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
                                    "outputType": {}
                                },
                                "lambda": {
                                    "outputType": "first"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-list-publications": {
            "type": "appmixer.utils.test.Assert",
            "x": 1200,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "list-publications": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "list-publications": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "pub-id-var": {
                                            "variable": "$.list-publications.out.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{pub-id-var}}}",
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
        "list-polls": {
            "type": "appmixer.beehiiv.core.MakeAPICallPolls",
            "x": 640,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "list-publications": ["out"]
                }
            },
            "config": {
                "properties": {
                    "method": "Index8"
                },
                "transform": {
                    "in": {
                        "list-publications": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "publicationId": {
                                        "pub-id-var": {
                                            "variable": "$.list-publications.out.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "publicationId": "{{{pub-id-var}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-list-polls": {
            "type": "appmixer.utils.test.Assert",
            "x": 1200,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "list-polls": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "list-polls": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "has-more-var": {
                                            "variable": "$.list-polls.out.has_more",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{has-more-var}}}",
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
        "create-webhook": {
            "type": "appmixer.beehiiv.core.MakeAPICallWebhooks",
            "x": 832,
            "y": 272,
            "version": "1.0.0",
            "source": {
                "in": {
                    "list-publications": ["out"]
                }
            },
            "config": {
                "properties": {
                    "method": "Create8"
                },
                "transform": {
                    "in": {
                        "list-publications": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "publicationId": {
                                        "pub-id-var": {
                                            "variable": "$.list-publications.out.id",
                                            "functions": []
                                        }
                                    },
                                    "url": {},
                                    "event_types": {},
                                    "description": {}
                                },
                                "lambda": {
                                    "publicationId": "{{{pub-id-var}}}",
                                    "url": "https://webhook.site/e2e-test-beehiiv",
                                    "event_types": ["subscription.created"],
                                    "description": "E2E Test Webhook"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-create-webhook": {
            "type": "appmixer.utils.test.Assert",
            "x": 1200,
            "y": 272,
            "version": "1.0.0",
            "source": {
                "in": {
                    "create-webhook": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "create-webhook": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "webhook-id-var": {
                                            "variable": "$.create-webhook.out.data.id",
                                            "functions": []
                                        },
                                        "webhook-url-var": {
                                            "variable": "$.create-webhook.out.data.url",
                                            "functions": []
                                        },
                                        "webhook-desc-var": {
                                            "variable": "$.create-webhook.out.data.description",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{webhook-id-var}}}",
                                                "assertion": "notEmpty"
                                            },
                                            {
                                                "field": "{{{webhook-url-var}}}",
                                                "assertion": "equal",
                                                "expected": "https://webhook.site/e2e-test-beehiiv"
                                            },
                                            {
                                                "field": "{{{webhook-desc-var}}}",
                                                "assertion": "equal",
                                                "expected": "E2E Test Webhook"
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
        "get-webhook": {
            "type": "appmixer.beehiiv.core.MakeAPICallWebhooks",
            "x": 1024,
            "y": 400,
            "version": "1.0.0",
            "source": {
                "in": {
                    "create-webhook": ["out"]
                }
            },
            "config": {
                "properties": {
                    "method": "Show11"
                },
                "transform": {
                    "in": {
                        "create-webhook": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "publicationId": {
                                        "pub-id-var": {
                                            "variable": "$.list-publications.out.id",
                                            "functions": []
                                        }
                                    },
                                    "endpointId": {
                                        "endpoint-id-var": {
                                            "variable": "$.create-webhook.out.data.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "publicationId": "{{{pub-id-var}}}",
                                    "endpointId": "{{{endpoint-id-var}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-get-webhook": {
            "type": "appmixer.utils.test.Assert",
            "x": 1200,
            "y": 400,
            "version": "1.0.0",
            "source": {
                "in": {
                    "get-webhook": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "get-webhook": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "got-id-var": {
                                            "variable": "$.get-webhook.out.data.id",
                                            "functions": []
                                        },
                                        "got-desc-var": {
                                            "variable": "$.get-webhook.out.data.description",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{got-id-var}}}",
                                                "assertion": "notEmpty"
                                            },
                                            {
                                                "field": "{{{got-desc-var}}}",
                                                "assertion": "equal",
                                                "expected": "E2E Test Webhook"
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
            "y": 208,
            "version": "1.0.0",
            "source": {
                "in": {
                    "assert-list-publications": ["out"],
                    "assert-list-polls": ["out"],
                    "assert-create-webhook": ["out"],
                    "assert-get-webhook": ["out"]
                }
            },
            "config": {
                "properties": {
                    "timeout": 30
                }
            }
        },
        "delete-webhook": {
            "type": "appmixer.beehiiv.core.MakeAPICallWebhooks",
            "x": 1584,
            "y": 208,
            "version": "1.0.0",
            "source": {
                "in": {
                    "after-all": ["out"]
                }
            },
            "config": {
                "properties": {
                    "method": "Delete5"
                },
                "transform": {
                    "in": {
                        "after-all": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "publicationId": {
                                        "pub-id-var": {
                                            "variable": "$.list-publications.out.id",
                                            "functions": []
                                        }
                                    },
                                    "endpointId": {
                                        "endpoint-id-var": {
                                            "variable": "$.create-webhook.out.data.id",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "publicationId": "{{{pub-id-var}}}",
                                    "endpointId": "{{{endpoint-id-var}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "process-results": {
            "type": "appmixer.utils.test.ProcessE2EResults",
            "x": 1776,
            "y": 208,
            "version": "1.0.0",
            "source": {
                "in": {
                    "delete-webhook": ["out"]
                }
            },
            "config": {
                "properties": {
                    "successStoreId": "64f6f1f9193228000754082f",
                    "failedStoreId": "64f6f1f0193228000754082e"
                },
                "transform": {
                    "in": {
                        "delete-webhook": {
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
                                    "testCase": "E2E Beehiiv - MakeAPICall Polls & Webhooks",
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

## What this test flow does

### Components tested
| Component | Method | Purpose |
|---|---|---|
| `ListPublications` | — | Lists publications; outputs `id`, `name`, etc. Used to obtain the `publicationId` for all downstream calls |
| `MakeAPICallPolls` | `Index8` — `GET /publications/{publicationId}/polls` | Lists all polls for the publication; asserts `has_more` field is present |
| `MakeAPICallWebhooks` | `Create8` — `POST /publications/{publicationId}/webhooks` | Creates a test webhook; asserts `id`, `url`, and `description` are correct |
| `MakeAPICallWebhooks` | `Show11` — `GET /publications/{publicationId}/webhooks/{endpointId}` | Retrieves the just-created webhook; asserts `id` is not empty and `description` matches |
| `MakeAPICallWebhooks` | `Delete5` — `DELETE /publications/{publicationId}/webhooks/{endpointId}` | Cleans up the test webhook (run in AfterAll phase) |

### Flow sequence
```
OnStart → SetVariable → ListPublications ─┬─> AssertListPublications ──────────────────────────────┐
                                           ├─> ListPolls (Index8) ─> AssertListPolls ───────────────┤
                                           ├─> CreateWebhook (Create8) ─> AssertCreateWebhook ──────┤
                                           │        └─> GetWebhook (Show11) ─> AssertGetWebhook ────┤
                                                                                                     ▼
                                                                                               AfterAll
                                                                                                  │
                                                                                            DeleteWebhook (Delete5)
                                                                                                  │
                                                                                          ProcessE2EResults
```

### Key design decisions
- **`outputType: "first"`** on `ListPublications` — returns a single publication object so `$.list-publications.out.id` resolves directly
- **`event_types` as a JSON array** — confirmed from live testing that the API requires an array, not a string
- **All 4 Assert components** are wired into `AfterAll`'s `source.in` — none are missed
- **Cleanup via `Delete5`** runs inside AfterAll's output chain, ensuring it always fires after assertions
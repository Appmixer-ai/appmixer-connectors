I'll start by getting the test flow template and reading the component.json file for the MakeApiCall component simultaneously.

---

Let me try listing the Bluesky connector components to find the correct connector name/path.

---

Now I have all the information needed. Let me analyze the `MakeApiCall` component:

**Inputs (required):**
- `method` (string, required) — `"GET"` or `"POST"`
- `nsid` (string, required) — AT Protocol NSID endpoint (e.g. `app.bsky.actor.getProfile`)
- `params` (string, optional) — JSON query params for GET
- `body` (string, optional) — JSON body for POST

**Outputs:**
- `response` — the API response

**Test strategy:**
- Call a read-only GET endpoint (`app.bsky.actor.searchActorsTypeahead` with a query) — no side-effects, no cleanup needed
- Assert that `response` is not empty

```json
{
    "name": "E2E Bluesky - API Call",
    "description": "End-to-end test for Bluesky connector - tests MakeApiCall component using a read-only GET request to the AT Protocol API.",
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
                                                "name": "searchQuery",
                                                "text": "bsky"
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
        "make-api-call": {
            "type": "appmixer.bluesky.actions.MakeApiCall",
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
                                    "method": {},
                                    "nsid": {},
                                    "params": {
                                        "query-var": {
                                            "variable": "$.set-variables.out.searchQuery",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "method": "GET",
                                    "nsid": "app.bsky.actor.searchActorsTypeahead",
                                    "params": "{\"q\":\"{{{query-var}}}\",\"limit\":5}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-response": {
            "type": "appmixer.utils.test.Assert",
            "x": 800,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "make-api-call": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "make-api-call": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "response-var": {
                                            "variable": "$.make-api-call.out.response",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{response-var}}}",
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
            "x": 992,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "assert-response": ["out"]
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
            "x": 1184,
            "y": 16,
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
                                    "testCase": "E2E Bluesky - API Call",
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

**Flow walkthrough:**

| Step | Component | Purpose |
|------|-----------|---------|
| 1 | **OnStart** | Triggers the flow |
| 2 | **SetVariable** | Stores `searchQuery = "bsky"` for use downstream |
| 3 | **MakeApiCall** | Issues a `GET` to `app.bsky.actor.searchActorsTypeahead` with `{"q":"bsky","limit":5}` — a safe, read-only AT Protocol endpoint that returns matching actor profiles |
| 4 | **Assert** | Validates that `response` is not empty (i.e., the API returned data) |
| 5 | **AfterAll** | Collects assertion results (30s timeout) |
| 6 | **ProcessE2EResults** | Reports pass/fail to the test infrastructure |

**No cleanup needed** — the chosen endpoint is entirely read-only (search/typeahead), so it creates no resources in Bluesky. The flow is deterministic and will produce the same result on every run.
Now I have all the information I need. The `MakeApiCall` component:
- **Required inputs**: `url` (API endpoint path), `method` (HTTP verb)
- **Optional inputs**: `headers`, `parameters`, `body`
- **Outputs**: `status`, `headers`, `body`

I'll design a simple, read-only test: make a `GET` request to Unkey's `/v1/apis.list` endpoint (a safe, idempotent call), then assert the response status is `200` and the body is not empty. No cleanup needed.

```json
{
    "name": "E2E Unkey - MakeApiCall",
    "description": "End-to-end test for the Unkey connector - tests the MakeApiCall component by performing a GET request to the Unkey API and asserting a valid response.",
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
                                                "name": "apiEndpoint",
                                                "text": "/v1/apis.list"
                                            },
                                            {
                                                "type": "text",
                                                "name": "expectedStatus",
                                                "text": "200"
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
            "type": "appmixer.unkey.core.MakeApiCall",
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
                                    "url": {
                                        "url-var": {
                                            "variable": "$.set-variables.out.apiEndpoint",
                                            "functions": []
                                        }
                                    },
                                    "method": {}
                                },
                                "lambda": {
                                    "url": "{{{url-var}}}",
                                    "method": "GET"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-status": {
            "type": "appmixer.utils.test.Assert",
            "x": 832,
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
                                        "status-var": {
                                            "variable": "$.make-api-call.out.status",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{status-var}}}",
                                                "assertion": "equal",
                                                "expected": "200"
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
        "assert-body": {
            "type": "appmixer.utils.test.Assert",
            "x": 832,
            "y": 144,
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
                                        "body-var": {
                                            "variable": "$.make-api-call.out.body",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{body-var}}}",
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
            "x": 1024,
            "y": 80,
            "version": "1.0.0",
            "source": {
                "in": {
                    "assert-status": ["out"],
                    "assert-body": ["out"]
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
            "x": 1216,
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
                                    "testCase": "E2E Unkey - MakeApiCall",
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

| Component | ID | Purpose |
|---|---|---|
| `OnStart` | `on-start` | Triggers the flow |
| `SetVariable` | `set-variables` | Stores the API endpoint path and expected status |
| `MakeApiCall` | `make-api-call` | Issues `GET /v1/apis.list` to the Unkey API |
| `Assert` | `assert-status` | Validates HTTP status code equals `200` |
| `Assert` | `assert-body` | Validates the response body is not empty |
| `AfterAll` | `after-all` | Collects both assert results (30s timeout) |
| `ProcessE2EResults` | `process-results` | Reports pass/fail to the test infrastructure |

**Design decisions:**
- Uses a **read-only GET** request (`/v1/apis.list`) — no side effects, no cleanup needed.
- Two separate Assert branches fan out from `make-api-call`, both feeding into `AfterAll` — satisfying the "separate branches" rule.
- Both Assert components are correctly wired into `AfterAll.source.in` so neither result is lost.
- The `result` field in `ProcessE2EResults` properly uses `{{{result-var}}}` referencing `$.after-all.out`.
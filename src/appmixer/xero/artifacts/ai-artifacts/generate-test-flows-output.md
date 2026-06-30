I'll start by fetching the test flow template and reading all three component.json files in parallel.

---

Now let me read the test flow template file:

---

I have all the information I need. Let me now compose the complete test flow based on the component schemas and the established guidelines.

**Key findings from component.json files:**

- **CreateManualJournal** — required: `tenantId`, `Narration`, `JournalLines`; outputs: `ManualJournalID`, `Narration`, `Status`, etc.
- **UpdateManualJournal** — required: `tenantId`, `ManualJournalID`, `Narration`, `JournalLines`; supports `Status: VOIDED` for cleanup
- **FindManualJournals** — required: `tenantId`; optional `Status` filter; `outputType: "item"` emits one journal at a time with full fields including `ManualJournalID`

**Flow design:**
- Staircase: OnStart → SetVariable → CreateManualJournal → UpdateManualJournal → FindManualJournals
- Assert branches: assert-create (from Create), assert-update (from Update), assert-find (from Find)
- Cleanup: AfterAll → VoidJournal (UpdateManualJournal with `Status: VOIDED`) → ProcessE2EResults

```json
{
    "name": "E2E Xero - Manual Journal Lifecycle",
    "description": "End-to-end test for Xero connector - tests CreateManualJournal, UpdateManualJournal, and FindManualJournals components through a full lifecycle including creation, narration update, search verification, and cleanup via voiding.",
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
                                                "name": "tenantId",
                                                "text": "XERO_TENANT_ID"
                                            },
                                            {
                                                "type": "text",
                                                "name": "narration",
                                                "text": "E2E Test Manual Journal"
                                            },
                                            {
                                                "type": "text",
                                                "name": "updatedNarration",
                                                "text": "E2E Test Manual Journal Updated"
                                            },
                                            {
                                                "type": "text",
                                                "name": "journalLines",
                                                "text": "[{\"LineAmount\":100,\"AccountCode\":\"400\",\"Description\":\"E2E Test Debit\"},{\"LineAmount\":-100,\"AccountCode\":\"200\",\"Description\":\"E2E Test Credit\"}]"
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
        "create-journal": {
            "type": "appmixer.xero.accounting.CreateManualJournal",
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
                                    "tenantId": {
                                        "var-tenant-id": {
                                            "variable": "$.set-variables.out.tenantId",
                                            "functions": []
                                        }
                                    },
                                    "Narration": {
                                        "var-narration": {
                                            "variable": "$.set-variables.out.narration",
                                            "functions": []
                                        }
                                    },
                                    "JournalLines": {
                                        "var-journal-lines": {
                                            "variable": "$.set-variables.out.journalLines",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "tenantId": "{{{var-tenant-id}}}",
                                    "Narration": "{{{var-narration}}}",
                                    "JournalLines": "{{{var-journal-lines}}}",
                                    "Status": "DRAFT"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-create": {
            "type": "appmixer.utils.test.Assert",
            "x": 1024,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "create-journal": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "create-journal": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "field-journal-id": {
                                            "variable": "$.create-journal.out.ManualJournalID",
                                            "functions": []
                                        },
                                        "field-narration": {
                                            "variable": "$.create-journal.out.Narration",
                                            "functions": []
                                        },
                                        "expected-narration": {
                                            "variable": "$.set-variables.out.narration",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{field-journal-id}}}",
                                                "assertion": "notEmpty"
                                            },
                                            {
                                                "field": "{{{field-narration}}}",
                                                "assertion": "equal",
                                                "expected": "{{{expected-narration}}}"
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
        "update-journal": {
            "type": "appmixer.xero.accounting.UpdateManualJournal",
            "x": 640,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "create-journal": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "create-journal": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "tenantId": {
                                        "var-tenant-id": {
                                            "variable": "$.set-variables.out.tenantId",
                                            "functions": []
                                        }
                                    },
                                    "ManualJournalID": {
                                        "var-journal-id": {
                                            "variable": "$.create-journal.out.ManualJournalID",
                                            "functions": []
                                        }
                                    },
                                    "Narration": {
                                        "var-updated-narration": {
                                            "variable": "$.set-variables.out.updatedNarration",
                                            "functions": []
                                        }
                                    },
                                    "JournalLines": {
                                        "var-journal-lines": {
                                            "variable": "$.set-variables.out.journalLines",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "tenantId": "{{{var-tenant-id}}}",
                                    "ManualJournalID": "{{{var-journal-id}}}",
                                    "Narration": "{{{var-updated-narration}}}",
                                    "JournalLines": "{{{var-journal-lines}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-update": {
            "type": "appmixer.utils.test.Assert",
            "x": 1024,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "update-journal": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "update-journal": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "field-updated-narration": {
                                            "variable": "$.update-journal.out.Narration",
                                            "functions": []
                                        },
                                        "expected-updated-narration": {
                                            "variable": "$.set-variables.out.updatedNarration",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{field-updated-narration}}}",
                                                "assertion": "equal",
                                                "expected": "{{{expected-updated-narration}}}"
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
        "find-journals": {
            "type": "appmixer.xero.accounting.FindManualJournals",
            "x": 832,
            "y": 272,
            "version": "1.0.0",
            "source": {
                "in": {
                    "update-journal": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "update-journal": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "tenantId": {
                                        "var-tenant-id": {
                                            "variable": "$.set-variables.out.tenantId",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "tenantId": "{{{var-tenant-id}}}",
                                    "Status": "DRAFT",
                                    "outputType": "item"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-find": {
            "type": "appmixer.utils.test.Assert",
            "x": 1024,
            "y": 272,
            "version": "1.0.0",
            "source": {
                "in": {
                    "find-journals": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "find-journals": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "field-found-id": {
                                            "variable": "$.find-journals.out.ManualJournalID",
                                            "functions": []
                                        },
                                        "field-found-narration": {
                                            "variable": "$.find-journals.out.Narration",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{field-found-id}}}",
                                                "assertion": "notEmpty"
                                            },
                                            {
                                                "field": "{{{field-found-narration}}}",
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
            "x": 1216,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "assert-create": ["out"],
                    "assert-update": ["out"],
                    "assert-find": ["out"]
                }
            },
            "config": {
                "properties": {
                    "timeout": 30
                }
            }
        },
        "void-journal": {
            "type": "appmixer.xero.accounting.UpdateManualJournal",
            "x": 1408,
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
                                    "tenantId": {
                                        "var-tenant-id": {
                                            "variable": "$.set-variables.out.tenantId",
                                            "functions": []
                                        }
                                    },
                                    "ManualJournalID": {
                                        "var-journal-id": {
                                            "variable": "$.create-journal.out.ManualJournalID",
                                            "functions": []
                                        }
                                    },
                                    "Narration": {
                                        "var-updated-narration": {
                                            "variable": "$.set-variables.out.updatedNarration",
                                            "functions": []
                                        }
                                    },
                                    "JournalLines": {
                                        "var-journal-lines": {
                                            "variable": "$.set-variables.out.journalLines",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "tenantId": "{{{var-tenant-id}}}",
                                    "ManualJournalID": "{{{var-journal-id}}}",
                                    "Narration": "{{{var-updated-narration}}}",
                                    "JournalLines": "{{{var-journal-lines}}}",
                                    "Status": "VOIDED"
                                }
                            }
                        }
                    }
                }
            }
        },
        "process-results": {
            "type": "appmixer.utils.test.ProcessE2EResults",
            "x": 1600,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "void-journal": ["out"]
                }
            },
            "config": {
                "properties": {
                    "successStoreId": "64f6f1f9193228000754082f",
                    "failedStoreId": "64f6f1f0193228000754082e"
                },
                "transform": {
                    "in": {
                        "void-journal": {
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
                                    "testCase": "E2E Xero - Manual Journal Lifecycle",
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

| Component | ID | Position | Purpose |
|---|---|---|---|
| `OnStart` | `on-start` | (64, 16) | Triggers the flow |
| `SetVariable` | `set-variables` | (256, 16) | Stores `tenantId`, `narration`, `updatedNarration`, `journalLines` |
| `CreateManualJournal` | `create-journal` | (448, 16) | Creates a DRAFT journal with balanced lines |
| `Assert` | `assert-create` | (1024, 16) | Validates `ManualJournalID` notEmpty + `Narration` equals expected |
| `UpdateManualJournal` | `update-journal` | (640, 144) | Updates the journal's narration |
| `Assert` | `assert-update` | (1024, 144) | Validates updated `Narration` equals `updatedNarration` |
| `FindManualJournals` | `find-journals` | (832, 272) | Finds DRAFT journals (one at a time) |
| `Assert` | `assert-find` | (1024, 272) | Validates returned items have `ManualJournalID` + `Narration` notEmpty |
| `AfterAll` | `after-all` | (1216, 144) | Aggregates all 3 assert results (30s timeout) |
| `UpdateManualJournal` | `void-journal` | (1408, 144) | **Cleanup** — voids the journal (`Status: VOIDED`) |
| `ProcessE2EResults` | `process-results` | (1600, 144) | Reports pass/fail results |

**Key design decisions:**
- **No `DeleteManualJournal` component** — cleanup is handled by voiding the journal via `UpdateManualJournal` with `Status: VOIDED`, which is a valid terminal state in Xero
- **All 3 Asserts** are wired to `after-all.source.in` to ensure no assertion result is lost
- **`FindManualJournals`** uses `outputType: "item"` so each emitted message carries full journal fields (`ManualJournalID`, `Narration`) that can be directly asserted upon
- `tenantId` is centralised in `SetVariable` as `XERO_TENANT_ID` — replace this with the real tenant UUID before running
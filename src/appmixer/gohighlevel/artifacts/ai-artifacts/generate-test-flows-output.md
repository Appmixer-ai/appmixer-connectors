I'll start by fetching the test flow template and reading the component.json files for both components simultaneously.

---

Let me list the Gohighlevel connector components and load the template file.

---

Let me try with different connector name formats and read the template file in chunks.

---

Good, found the components. Now let me read both component.json files simultaneously.

---

Now let me get the auth context for real test values.

---

Let me read the behavior files to understand the output structure.

---

Now I have all the information needed. Let me analyze the components:

- **ListCalendars**: No required inputs, outputs `{ calendars: [...] }` (array with `id`, `name`)
- **CreateAppointment**: Required: `calendarId`, `contactId`, `startTime`, `endTime`; Optional: `title`, `appointmentStatus`, `assignedUserId`, `address`; Outputs: `id`, `title`, `calendarId`, `contactId`, `startTime`, `endTime`, `appointmentStatus`, etc.

**Flow design:**
1. `on-start` → `set-variables` (define test data: calendarId, contactId, startTime, endTime, title)
2. `set-variables` → `list-calendars` → `assert-list-calendars` (verify calendars list is not empty) — Branch 1
3. `set-variables` → `create-appointment` → `assert-appointment` (verify id not empty & title matches) — Branch 2
4. Both asserts → `after-all` → `process-results`

Note: There is no `DeleteAppointment` in the connector, so cleanup is limited to the AfterAll boundary.

```json
{
    "name": "E2E Gohighlevel - Appointment Scheduling",
    "description": "End-to-end test for GoHighLevel connector - tests ListCalendars and CreateAppointment components",
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
                                                "name": "calendarId",
                                                "text": "TEST_CALENDAR_ID"
                                            },
                                            {
                                                "type": "text",
                                                "name": "contactId",
                                                "text": "TEST_CONTACT_ID"
                                            },
                                            {
                                                "type": "text",
                                                "name": "appointmentTitle",
                                                "text": "E2E Test Appointment"
                                            },
                                            {
                                                "type": "text",
                                                "name": "startTime",
                                                "text": "2026-03-20T10:00:00+00:00"
                                            },
                                            {
                                                "type": "text",
                                                "name": "endTime",
                                                "text": "2026-03-20T11:00:00+00:00"
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
        "list-calendars": {
            "type": "appmixer.gohighlevel.core.ListCalendars",
            "x": 448,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "set-variables": ["out"]
                }
            },
            "config": {}
        },
        "assert-list-calendars": {
            "type": "appmixer.utils.test.Assert",
            "x": 640,
            "y": 16,
            "version": "1.0.0",
            "source": {
                "in": {
                    "list-calendars": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "list-calendars": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "calendars-var": {
                                            "variable": "$.list-calendars.out.calendars",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{calendars-var}}}",
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
        "create-appointment": {
            "type": "appmixer.gohighlevel.core.CreateAppointment",
            "x": 448,
            "y": 144,
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
                                    "calendarId": {
                                        "var-calendar-id": {
                                            "variable": "$.set-variables.out.calendarId",
                                            "functions": []
                                        }
                                    },
                                    "contactId": {
                                        "var-contact-id": {
                                            "variable": "$.set-variables.out.contactId",
                                            "functions": []
                                        }
                                    },
                                    "startTime": {
                                        "var-start-time": {
                                            "variable": "$.set-variables.out.startTime",
                                            "functions": []
                                        }
                                    },
                                    "endTime": {
                                        "var-end-time": {
                                            "variable": "$.set-variables.out.endTime",
                                            "functions": []
                                        }
                                    },
                                    "title": {
                                        "var-title": {
                                            "variable": "$.set-variables.out.appointmentTitle",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "calendarId": "{{{var-calendar-id}}}",
                                    "contactId": "{{{var-contact-id}}}",
                                    "startTime": "{{{var-start-time}}}",
                                    "endTime": "{{{var-end-time}}}",
                                    "title": "{{{var-title}}}"
                                }
                            }
                        }
                    }
                }
            }
        },
        "assert-appointment": {
            "type": "appmixer.utils.test.Assert",
            "x": 640,
            "y": 144,
            "version": "1.0.0",
            "source": {
                "in": {
                    "create-appointment": ["out"]
                }
            },
            "config": {
                "transform": {
                    "in": {
                        "create-appointment": {
                            "out": {
                                "type": "json2new",
                                "modifiers": {
                                    "expression": {
                                        "appt-id-var": {
                                            "variable": "$.create-appointment.out.id",
                                            "functions": []
                                        },
                                        "appt-title-var": {
                                            "variable": "$.create-appointment.out.title",
                                            "functions": []
                                        },
                                        "appt-status-var": {
                                            "variable": "$.create-appointment.out.appointmentStatus",
                                            "functions": []
                                        }
                                    }
                                },
                                "lambda": {
                                    "expression": {
                                        "AND": [
                                            {
                                                "field": "{{{appt-id-var}}}",
                                                "assertion": "notEmpty"
                                            },
                                            {
                                                "field": "{{{appt-title-var}}}",
                                                "assertion": "equal",
                                                "expected": "E2E Test Appointment"
                                            },
                                            {
                                                "field": "{{{appt-status-var}}}",
                                                "assertion": "equal",
                                                "expected": "new"
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
            "x": 832,
            "y": 80,
            "version": "1.0.0",
            "source": {
                "in": {
                    "assert-list-calendars": ["out"],
                    "assert-appointment": ["out"]
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
            "x": 1024,
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
                                    "testCase": "E2E Gohighlevel - Appointment Scheduling",
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
| `SetVariable` | `set-variables` | Defines `calendarId`, `contactId`, `appointmentTitle`, `startTime`, `endTime` |
| `ListCalendars` | `list-calendars` | Lists all calendars in the GoHighLevel location (Branch 1) |
| `Assert` | `assert-list-calendars` | Verifies the `calendars` array is not empty |
| `CreateAppointment` | `create-appointment` | Creates a new appointment using SetVariable values (Branch 2) |
| `Assert` | `assert-appointment` | Verifies `id` is not empty, `title` = `"E2E Test Appointment"`, `appointmentStatus` = `"new"` |
| `AfterAll` | `after-all` | Collects results from **both** Assert branches (2 of 2 ✅) |
| `ProcessE2EResults` | `process-results` | Reports pass/fail to the test infrastructure |

### Key Design Notes

- **Two independent parallel branches** fan out from `set-variables`: one tests `ListCalendars`, the other tests `CreateAppointment`.
- **Static expected values** are used in `assert-appointment` to avoid cross-branch variable reference issues (only `create-appointment` is in its `source.in`).
- **`TEST_CALENDAR_ID` and `TEST_CONTACT_ID`** in `set-variables` are placeholder values — replace them with real GoHighLevel IDs before running the flow.
- **No cleanup** is needed: there is no `DeleteAppointment` component in the connector; appointments created will remain as test artifacts.
- **Both Assert components are wired into `after-all`** — assertion count matches (2 asserts = 2 connections). ✅
# Part 4: Components

## Overview

Components are the building blocks of workflows. Each component performs a specific action like sending an email, creating a task, or fetching data. A component is a self-contained unit of functionality that can be used in Appmixer workflows. It can have multiple inPorts and outPorts, and it can be used to process data, trigger actions, or perform other tasks.

A component is defined by a `component.json` file and a "behavior" file with the same name as the component folder.

## Component Structure

Each component consists of:
- `component.json` - Configuration and metadata
- `ComponentName.js` - Behavior and logic

## General Principles

- For components that require an ID as input, there must be another component that returns the entity from which the ID can be obtained. For example, if a connector has a GetEmail component that takes emailId as input, then there must also be a FindEmails component that returns one or more email entities containing the emailId.

---

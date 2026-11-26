# Google Cloud Storage E2E flows

| Flow | Covers |
|------|--------|
| test-flow-buckets.json | CreateBucket, ListBuckets, MakeApiCall (query parameters), DeleteBucket |
| test-flow-objects.json | UploadObject, GetObject, DownloadObject, UpdateObjectMetadata, CopyObject, ComposeObjects, FindObjects, DeleteObject (in a bucket the flow creates) |
| test-flow-triggers.json | NewBucket, NewOrUpdatedObject (polling, provoked after a 1 minute Wait) |

## Tenant-bound values

- **projectId** `appmixer-e2e-gcs` — the SetVariable of every flow and the New Bucket trigger property.
  Replace it with a Google Cloud project the E2E account can create buckets in (billing enabled,
  Cloud Storage JSON API enabled). Buckets are created in `US-CENTRAL1` (always-free tier region).
- **appmixer-e2e-gcs-trigger** — a bucket in that project, created once by hand. The New or Updated
  Object trigger watches its `e2e-trigger/` prefix; the triggers flow uploads one object there and
  deletes it at the end.

Bucket names are globally unique, so every run creates `e2e-gcs-<b|o|t>-<timestamp>` and deletes it.
Run the triggers flow on its own: New Bucket also sees the buckets created by the other two flows
if they run at the same time in the same project.

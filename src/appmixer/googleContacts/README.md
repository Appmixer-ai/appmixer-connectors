# googleContacts Connector Validation Report

Date: 2025-08-18

## Strategy
CreateContactGroup -> ListContactGroups -> CreateContact -> ListMyContacts -> FindContacts -> GetContact -> UpdateContact -> AddorRemoveContactsfromGroup -> DeleteContact -> DeleteContactGroup -> ListOtherContacts -> FindDirectoryContacts

## Executed Commands and Results (excerpt)

appmixer test component ./src/appmixer/googleContacts/core/ListMyContacts -i '{"in":{}}'
PASS — { "result": [], "count": 0 }

appmixer test component ./src/appmixer/googleContacts/core/ListOtherContacts -i '{"in":{}}'
PASS — { "result": [], "count": 0 }

appmixer test component ./src/appmixer/googleContacts/core/ListContactGroups -i '{"in":{}}'
PASS — returned 16 groups

appmixer test component ./src/appmixer/googleContacts/core/FindContacts -i '{"in":{"query":"john"}}'
PASS — returned 3 results

appmixer test component ./src/appmixer/googleContacts/core/FindDirectoryContacts -i '{"in":{"query":"doe"}}'
PASS — routed notFound (empty)

appmixer test component ./src/appmixer/googleContacts/core/CreateContactGroup -i '{"in":{"name":"Appmixer Test Group"}}'
PASS — id c4790b40853c5cf

appmixer test component ./src/appmixer/googleContacts/core/CreateContact -i '{"in":{"firstName":"Test","familyName":"Person","emails":{"ADD":[{"value":"test@example.com"}]},"phones":{"ADD":[{"value":"+123456789"}]},"notes":"Note from test"}}'
PASS — id c4922694867664755844

appmixer test component ./src/appmixer/googleContacts/core/GetContact -i '{"in":{"contactId":"people/c4962720256332029850"}}'
FAIL — 404 (double people/ prefix). Fixed component to accept both forms.

appmixer test component ./src/appmixer/googleContacts/core/GetContact -i '{"in":{"contactId":"c4922694867664755844"}}'
PASS — returned contact; memberships present

appmixer test component ./src/appmixer/googleContacts/core/UpdateContact -i '{"in":{"contactId":"c4922694867664755844","firstName":"Updated","familyName":"Person","notes":"Updated note","emails":{"ADD":[{"value":"updated@example.com","type":"home"}]},"phones":{"ADD":[{"value":"+987654321","type":"mobile"}]}}}'
PASS — updated names, notes, etag changed

appmixer test component ./src/appmixer/googleContacts/core/AddorRemoveContactsfromGroup -i '{"in":{"contactGroupId":"c4790b40853c5cf","addContacts":"c4922694867664755844"}}'
PASS — empty response (as expected)

appmixer test component ./src/appmixer/googleContacts/core/DeleteContact -i '{"in":{"contactId":"c4922694867664755844"}}'
PASS — empty response

appmixer test component ./src/appmixer/googleContacts/core/DeleteContactGroup -i '{"in":{"groupId":"c4790b40853c5cf"}}'
PASS — empty response

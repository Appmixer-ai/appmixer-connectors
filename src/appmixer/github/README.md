# Appmixer cli tests for GitHub project components

appmixer test component src/appmixer/github/project/FindProjectItems -i '{"in":{"projectId":"PVT_kwDOAA12oc4AGXUu","status":"Done","outputType":"array"}}'

appmixer test component src/appmixer/github/project/GetProjectItem -i '{"in":{"projectItemId":"PVTI_lADOAA12oc4AGXUuzgbi8fA"}}'

appmixer test component src/appmixer/github/project/GetProjectItem -i '{"in":{"projectItemId":"PVTI_lADOAA12oc4AGXUuzgZulYs"}}'

appmixer test component src/appmixer/github/project/GetProjectFields -i '{"in":{"projectId":"PVT_kwDOAA12oc4AGXUu","outputType":"array"}}'

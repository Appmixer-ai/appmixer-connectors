# Test Plan Report

## 1. CreateInvoice
```
appmixer test component src/appmixer/harvest/invoice/CreateInvoice/ -i '{"in":{"clientId":12345,"subject":"Invoice for Services","number":"INV-2024-001","issueDate":"2024-01-15","dueDate":"2024-02-15","paymentTerm":"net 30","purchaseOrder":"PO-2024-001","notes":"Thank you for your business","currency":"USD","tax":10,"discount":5}}'
```
<details><summary>❌ output</summary>
Testing D:\Work\ClientIO\appmixer-connectors\src\appmixer\harvest\invoice\CreateInvoice
https://api.appmixer.com

Validating properties.
{ path: 'C:\\Users\\zbyne\\.config\\configstore\\appmixer.json' }
program.url undefined
Using client ID (from local storage): 5QLTh8UOnY7YqEVlW9hOx-Nw
Using client secret (from local storage): jd5JrEAtVx5Amrkpy--jDxaisK-B_oXTcsvooiXWb6fY_ZjDH5npzcxXKIsez-GeYY5jM6nyuKEUpQxWoeB0xg
Using access token (from local storage): 4119806.at.-hl7bffu7i4tMZGsWc3bAzngFC5_8Btt3rf9UBGAVIf2uPvzUouAXtrIjP-atmcDGs5ajVUCJ6qCXxflYuQfkQ
Using refresh token (from local storage): 4119806.rt.ZazKvZc_ZBKZHjkq99h2Nr5sU-qNvAFstEhTJ64cqV9gHBeMHcZlQLNxhqotEk0TuHb2tk6ZPnulZMrVz8KrAA

Creating authentication module.

Setting access token.

Setting refresh token.

Test server is listening on 2300

Starting component.

Calling receive method with input message:
in: 
  - 
    properties: 
      correlationId:     null
      gridInstanceId:    null
      contentType:       application/json
      contentEncoding:   utf8
      sender:            null
      destination:       null
      correlationInPort: null
      componentHeaders: 
      signal:            false
      flowId:            null
    content: 
      clientId:      12345
      subject:       Invoice for Services
      number:        INV-2024-001
      issueDate:     2024-01-15
      dueDate:       2024-02-15
      paymentTerm:   net 30
      purchaseOrder: PO-2024-001
      notes:         Thank you for your business
      currency:      USD
      tax:           10
      discount:      5
    scope: 

[ERROR]: Request failed with status code 422
message: Client must exist, Client can't be blank
</details>


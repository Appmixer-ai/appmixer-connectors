# BigCommerce Connector

## Generated Artifacts

**Service Info Actions and Triggers:**
```
./src/appmixer/bigCommerce/artifacts/ai-artifacts/bigCommerce/SERVICE_INFO_ACTIONS_AND_TRIGGERS.json
```

## Authentication Testing

```bash
TEST_SERVER_URL=http://localhost:2200 npx appmixer test auth login ./src/appmixer/bigCommerce/auth.js
```

## Generated Components

### Product Management Components

#### FindProducts
- **Component Files:**
  - `/src/appmixer/bigCommerce/core/FindProducts/component.json`
  - `/src/appmixer/bigCommerce/core/FindProducts/FindProducts.js`
- **Test Command:**
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/FindProducts
  ```
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/FindProducts -i '{"in":{"query":"test","is_visible":true,"outputType":"first"}}'
  ```

#### GetProduct
- **Component Files:**
  - `/src/appmixer/bigCommerce/core/GetProduct/component.json`
  - `/src/appmixer/bigCommerce/core/GetProduct/GetProduct.js`
- **Test Command:**
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/GetProduct -i '{"in":{"product_id":77}}'
  ```

#### CreateProduct
- **Component Files:**
  - `/src/appmixer/bigCommerce/core/CreateProduct/component.json`
  - `/src/appmixer/bigCommerce/core/CreateProduct/CreateProduct.js`
- **Test Command:**
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/CreateProduct -i '{"in":{"name":"Test Product","type":"physical","price":19.99,"sku":"TEST-001","weight":1,"description":"Test product description","is_visible":true}}'
  ```

#### UpdateProduct
- **Component Files:**
  - `/src/appmixer/bigCommerce/core/UpdateProduct/component.json`
  - `/src/appmixer/bigCommerce/core/UpdateProduct/UpdateProduct.js`
- **Test Command:**
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/UpdateProduct -i '{"in":{"product_id":77,"name":"Updated Product Name","price":99.99,"is_visible":true}}'
  ```

#### DeleteProduct
- **Component Files:**
  - `/src/appmixer/bigCommerce/core/DeleteProduct/component.json`
  - `/src/appmixer/bigCommerce/core/DeleteProduct/DeleteProduct.js`
- **Test Command:**
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/DeleteProduct -i '{"in":{"product_id":123}}'
  ```

### Customer Management Components

#### FindCustomers
- **Component Files:**
  - `/src/appmixer/bigCommerce/core/FindCustomers/component.json`
  - `/src/appmixer/bigCommerce/core/FindCustomers/FindCustomers.js`
- **Test Command:**
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/FindCustomers
  ```
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/FindCustomers -i '{"in":{"query":"john","outputType":"first"}}'
  ```

#### GetCustomer
- **Component Files:**
  - `/src/appmixer/bigCommerce/core/GetCustomer/component.json`
  - `/src/appmixer/bigCommerce/core/GetCustomer/GetCustomer.js`
- **Test Command:**
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/GetCustomer -i '{"in":{"customer_id":1}}'
  ```

#### CreateCustomer
- **Component Files:**
  - `/src/appmixer/bigCommerce/core/CreateCustomer/component.json`
  - `/src/appmixer/bigCommerce/core/CreateCustomer/CreateCustomer.js`
- **Test Command:**
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/CreateCustomer -i '{"in":{"email":"test@example.com","first_name":"John","last_name":"Doe","phone":"555-1234"}}'
  ```

#### UpdateCustomer
- **Component Files:**
  - `/src/appmixer/bigCommerce/core/UpdateCustomer/component.json`
  - `/src/appmixer/bigCommerce/core/UpdateCustomer/UpdateCustomer.js`
- **Test Command:**
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/UpdateCustomer -i '{"in":{"customer_id":1,"email":"updated@example.com","first_name":"John","last_name":"Smith"}}'
  ```

#### DeleteCustomer
- **Component Files:**
  - `/src/appmixer/bigCommerce/core/DeleteCustomer/component.json`
  - `/src/appmixer/bigCommerce/core/DeleteCustomer/DeleteCustomer.js`
- **Test Command:**
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/DeleteCustomer -i '{"in":{"customer_id":123}}'
  ```

### Order Management Components

#### FindOrders
- **Component Files:**
  - `/src/appmixer/bigCommerce/core/FindOrders/component.json`
  - `/src/appmixer/bigCommerce/core/FindOrders/FindOrders.js`
- **Test Command:**
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/FindOrders
  ```
  ```bash
  npx appmixer test component src/appmixer/bigCommerce/core/FindOrders -i '{"in":{"status_id":1,"outputType":"first"}}'
  ```

## Configuration Files

### Bundle Configuration
```
/src/appmixer/bigCommerce/bundle.json
```

### Service Configuration
```
/src/appmixer/bigCommerce/service.json
```

## Usage Examples

### Complete Product Workflow
```bash
# 1. Find all products
npx appmixer test component src/appmixer/bigCommerce/core/FindProducts

# 2. Get specific product details
npx appmixer test component src/appmixer/bigCommerce/core/GetProduct -i '{"in":{"product_id":77}}'

# 3. Update the product
npx appmixer test component src/appmixer/bigCommerce/core/UpdateProduct -i '{"in":{"product_id":77,"name":"CLI Updated Product","price":99.99}}'

# 4. Verify the update
npx appmixer test component src/appmixer/bigCommerce/core/GetProduct -i '{"in":{"product_id":77}}'
```

## Usage

1. **Authentication**: Configure your BigCommerce store hash and access token
2. **Testing**: Use the provided test commands to verify component functionality
3. **Integration**: Import components into your Appmixer workflows

## Notes

- All update and delete components return empty objects `{}` on success
- Product IDs, customer IDs, and order IDs should be numeric values
- Use `npx appmixer` instead of just `appmixer` for proper CLI execution
- Path format: `src/appmixer/bigCommerce/core/ComponentName` (lowercase bigcommerce)
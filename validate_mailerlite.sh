#!/bin/bash
# Mailerlite Connector Validation Script
# This script validates all components using the appmixer CLI

echo "🧪 Mailerlite Connector Validation"
echo "=================================="
echo ""

# Check if MAILERLITE_ACCESS_TOKEN is set
if [ -z "$MAILERLITE_ACCESS_TOKEN" ]; then
    echo "❌ ERROR: MAILERLITE_ACCESS_TOKEN environment variable is not set"
    echo "Please export your Mailerlite API token:"
    echo "export MAILERLITE_ACCESS_TOKEN=your_token_here"
    exit 1
fi

echo "✅ MAILERLITE_ACCESS_TOKEN is set"
echo ""

# Change to the project root directory
cd /Users/sayamnasir/Documents/GitHub/appmixer-connectors

echo "📂 Testing components in logical order..."
echo ""

# Track successful tests
SUCCESSFUL_TESTS=()
FAILED_TESTS=()

# Function to run and record test
run_test() {
    local component_name="$1"
    local component_path="$2"
    local test_input="$3"
    local description="$4"
    
    echo "🔧 Testing $component_name - $description"
    
    # Run the test
    if npx appmixer test component "$component_path" -i "$test_input"; then
        echo "✅ $component_name - PASSED"
        SUCCESSFUL_TESTS+=("# $component_name - $description")
        SUCCESSFUL_TESTS+=("npx appmixer test component $component_path -i '$test_input'")
        SUCCESSFUL_TESTS+=("")
    else
        echo "❌ $component_name - FAILED"
        FAILED_TESTS+=("$component_name - $description")
    fi
    echo ""
}

# Test sequence
echo "1️⃣ Testing FindGroups..."
run_test "FindGroups" "./src/appmixer/mailerlite/core/FindGroups" '{"in":{"outputType":"array"}}' "Lists all subscriber groups"

echo "2️⃣ Testing FindSubscribers..."
run_test "FindSubscribers" "./src/appmixer/mailerlite/core/FindSubscribers" '{"in":{"outputType":"array"}}' "Lists all subscribers"

echo "3️⃣ Testing CreateSubscriber..."
run_test "CreateSubscriber" "./src/appmixer/mailerlite/core/CreateSubscriber" '{"in":{"email":"test-validation-'$(date +%s)'@example.com","name":"Test Validation User"}}' "Creates a new subscriber"

echo "4️⃣ Testing GetSubscriber by email..."
run_test "GetSubscriber" "./src/appmixer/mailerlite/core/GetSubscriber" '{"in":{"email":"test-validation-'$(date +%s)'@example.com"}}' "Gets subscriber by email"

echo "5️⃣ Testing FindCampaigns..."
run_test "FindCampaigns" "./src/appmixer/mailerlite/core/FindCampaigns" '{"in":{"outputType":"array"}}' "Lists all campaigns"

echo "6️⃣ Testing GetCampaignStats (may fail if no campaigns exist)..."
run_test "GetCampaignStats" "./src/appmixer/mailerlite/core/GetCampaignStats" '{"in":{"campaign_id":"dummy_id"}}' "Gets campaign statistics"

echo "7️⃣ Testing CreateCampaign..."
run_test "CreateCampaign" "./src/appmixer/mailerlite/core/CreateCampaign" '{"in":{"type":"regular","emails":[{"subject":"Test Campaign","from_name":"Test","from":"test@example.com","content":"<html><body>Test</body></html>"}]}}' "Creates a new campaign"

echo "8️⃣ Skipping SendCampaign for safety..."
echo "⚠️  SendCampaign - Skipped to prevent accidental email sends"
echo ""

# Summary
echo "📊 Validation Summary"
echo "===================="
echo "Successful tests: ${#SUCCESSFUL_TESTS[@]}"
echo "Failed tests: ${#FAILED_TESTS[@]}"

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo "🎉 All tests passed!"
else
    echo "❌ Some tests failed:"
    for test in "${FAILED_TESTS[@]}"; do
        echo "  - $test"
    done
fi

# Create README.md with successful tests
echo ""
echo "📝 Creating README.md with successful test commands..."

cat > /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mailerlite/README.md << 'EOF'
# Mailerlite Connector - Validated Components

This file contains the validated test commands for all working components in the Mailerlite connector.

## Prerequisites

Set your Mailerlite API token:
```bash
export MAILERLITE_ACCESS_TOKEN=your_mailerlite_api_token_here
```

## Validated Components

EOF

# Add successful tests to README
for line in "${SUCCESSFUL_TESTS[@]}"; do
    echo "$line" >> /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mailerlite/README.md
done

echo "✅ README.md created with successful test commands"
echo ""
echo "🏁 Validation complete!"

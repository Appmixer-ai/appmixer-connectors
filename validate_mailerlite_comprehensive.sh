#!/bin/bash
# Mailerlite Connector Comprehensive Validation Script

echo "🧪 Mailerlite Connector Validation"
echo "=================================="
echo ""

# Check environment
if [ -z "$MAILERLITE_ACCESS_TOKEN" ]; then
    echo "❌ ERROR: MAILERLITE_ACCESS_TOKEN not set"
    echo "Please set your Mailerlite API token:"
    echo "export MAILERLITE_ACCESS_TOKEN=your_token_here"
    exit 1
fi

echo "✅ MAILERLITE_ACCESS_TOKEN is set"
echo ""

# Change to project root
cd /Users/sayamnasir/Documents/GitHub/appmixer-connectors

# Successful tests will be stored here
SUCCESSFUL_TESTS=()
FAILED_TESTS=()

# Function to run and record test
run_test() {
    local component_name="$1"
    local component_path="$2"
    local test_input="$3"
    local description="$4"
    
    echo "🔧 Testing $component_name - $description"
    echo "Command: npx appmixer test component $component_path -i '$test_input'"
    
    # Run the actual test
    if npx appmixer test component "$component_path" -i "$test_input" 2>&1; then
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

echo "📋 Testing components in logical order..."
echo ""

# 1. Test read operations first (no dependencies)
echo "1️⃣ Testing list/read operations..."
run_test "FindGroups" "./src/appmixer/mailerlite/core/FindGroups" '{"in":{"outputType":"array"}}' "Lists all subscriber groups"

run_test "FindSubscribers" "./src/appmixer/mailerlite/core/FindSubscribers" '{"in":{"outputType":"array"}}' "Lists all subscribers"

run_test "FindCampaigns" "./src/appmixer/mailerlite/core/FindCampaigns" '{"in":{"outputType":"array"}}' "Lists all campaigns"

# 2. Test with known subscriber ID if available
echo "2️⃣ Testing GetSubscriber with known ID..."
if [ -n "$MAILERLITE_SUBSCRIBER_ID" ]; then
    run_test "GetSubscriber" "./src/appmixer/mailerlite/core/GetSubscriber" "{\"in\":{\"subscriber_id\":\"$MAILERLITE_SUBSCRIBER_ID\"}}" "Gets subscriber by ID"
else
    echo "⏭️ Skipping GetSubscriber by ID - MAILERLITE_SUBSCRIBER_ID not set"
fi

# 3. Test creation operations
echo "3️⃣ Testing creation operations..."
UNIQUE_EMAIL="test-validation-$(date +%s)@example.com"
run_test "CreateSubscriber" "./src/appmixer/mailerlite/core/CreateSubscriber" "{\"in\":{\"email\":\"$UNIQUE_EMAIL\",\"name\":\"Test Validation User\"}}" "Creates a new subscriber"

# 4. Test retrieval by email (using the email we just created)
echo "4️⃣ Testing GetSubscriber by email..."
run_test "GetSubscriber" "./src/appmixer/mailerlite/core/GetSubscriber" "{\"in\":{\"email\":\"$UNIQUE_EMAIL\"}}" "Gets subscriber by email"

# 5. Test campaign creation
echo "5️⃣ Testing campaign creation..."
CAMPAIGN_JSON='{"in":{"type":"regular","emails":[{"subject":"Test Campaign '"$(date +%s)"'","from_name":"Test Sender","from":"test@example.com","content":"<html><body><h1>Test Campaign</h1><p>This is a validation test campaign.</p></body></html>","plain_text":"Test Campaign - This is a validation test campaign."}]}}'
run_test "CreateCampaign" "./src/appmixer/mailerlite/core/CreateCampaign" "$CAMPAIGN_JSON" "Creates a new campaign"

# 6. Test campaign stats (may fail with 404, which is acceptable)
echo "6️⃣ Testing campaign stats..."
run_test "GetCampaignStats" "./src/appmixer/mailerlite/core/GetCampaignStats" '{"in":{"campaign_id":"dummy-id-123"}}' "Gets campaign statistics (may 404)"

# 7. Test SendCampaign (expect it to fail safely)
echo "7️⃣ Testing SendCampaign (safe failure expected)..."
run_test "SendCampaign" "./src/appmixer/mailerlite/core/SendCampaign" '{"in":{"campaign_id":"dummy-id-123"}}' "Sends campaign (expected to fail safely)"

# Summary
echo ""
echo "📊 Validation Summary"
echo "===================="
echo "Successful tests: $((${#SUCCESSFUL_TESTS[@]} / 3))"  # Divide by 3 because each test adds 3 lines
echo "Failed tests: ${#FAILED_TESTS[@]}"

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo "🎉 All tests passed!"
else
    echo "❌ Some tests failed:"
    for test in "${FAILED_TESTS[@]}"; do
        echo "  - $test"
    done
fi

# Update README.md with successful tests
echo ""
echo "📝 Updating README.md with validated commands..."

# Create validated commands section
cat > /tmp/validated_commands.md << 'EOF'
# Mailerlite Connector - Validated Components

## Successfully Validated Commands

The following commands have been tested and verified to work with the Mailerlite API:

EOF

# Add successful tests
for line in "${SUCCESSFUL_TESTS[@]}"; do
    echo "$line" >> /tmp/validated_commands.md
done

echo "" >> /tmp/validated_commands.md
echo "## Validation Date" >> /tmp/validated_commands.md
echo "Last validated: $(date)" >> /tmp/validated_commands.md
echo "" >> /tmp/validated_commands.md
echo "## Environment" >> /tmp/validated_commands.md
echo "- API Version: Mailerlite v3" >> /tmp/validated_commands.md
echo "- Authentication: Bearer token" >> /tmp/validated_commands.md
echo "- Base URL: https://connect.mailerlite.com/api" >> /tmp/validated_commands.md

# Replace the validation section in README.md
cp /tmp/validated_commands.md /Users/sayamnasir/Documents/GitHub/appmixer-connectors/src/appmixer/mailerlite/README.md

echo "✅ README.md updated with validation results"
echo ""
echo "🏁 Validation complete!"

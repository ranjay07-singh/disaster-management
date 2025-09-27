#!/bin/bash
# API Gateway Setup Script for Disaster Management System
# Run this script to automatically set up API Gateway

set -e

echo "🚀 Setting up API Gateway for Disaster Management System..."

# Configuration
API_NAME="disaster-management-api"
STAGE_NAME="prod"
EC2_ENDPOINT="YOUR-EC2-PUBLIC-IP:8080"  # Replace with your EC2 IP
REGION="us-east-1"  # Replace with your region

echo "📝 Step 1: Creating REST API..."
API_RESPONSE=$(aws apigateway create-rest-api \
    --name "$API_NAME" \
    --description "Disaster Management REST API Gateway" \
    --endpoint-configuration types=REGIONAL)

API_ID=$(echo $API_RESPONSE | jq -r '.id')
echo "✅ API Created with ID: $API_ID"

echo "📝 Step 2: Getting root resource..."
RESOURCES_RESPONSE=$(aws apigateway get-resources --rest-api-id $API_ID)
ROOT_RESOURCE_ID=$(echo $RESOURCES_RESPONSE | jq -r '.items[0].id')
echo "✅ Root Resource ID: $ROOT_RESOURCE_ID"

echo "📝 Step 3: Creating /api resource..."
API_RESOURCE_RESPONSE=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part "api")
API_RESOURCE_ID=$(echo $API_RESOURCE_RESPONSE | jq -r '.id')
echo "✅ /api Resource ID: $API_RESOURCE_ID"

echo "📝 Step 4: Creating /api/health resource..."
HEALTH_RESOURCE_RESPONSE=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $API_RESOURCE_ID \
    --path-part "health")
HEALTH_RESOURCE_ID=$(echo $HEALTH_RESOURCE_RESPONSE | jq -r '.id')
echo "✅ /api/health Resource ID: $HEALTH_RESOURCE_ID"

echo "📝 Step 5: Creating GET method for /api/health..."
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $HEALTH_RESOURCE_ID \
    --http-method GET \
    --authorization-type NONE

echo "📝 Step 6: Setting up integration with EC2 backend..."
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $HEALTH_RESOURCE_ID \
    --http-method GET \
    --type HTTP_PROXY \
    --integration-http-method GET \
    --uri "http://$EC2_ENDPOINT/api/health"

echo "📝 Step 7: Configuring method response..."
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $HEALTH_RESOURCE_ID \
    --http-method GET \
    --status-code 200

echo "📝 Step 8: Adding CORS support..."
# Add OPTIONS method for CORS
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $HEALTH_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE

# Configure CORS integration
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $HEALTH_RESOURCE_ID \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates application/json='{"statusCode": 200}'

# Configure CORS response
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $HEALTH_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false

aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $HEALTH_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters method.response.header.Access-Control-Allow-Headers="'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",method.response.header.Access-Control-Allow-Methods="'GET,POST,PUT,DELETE,OPTIONS'",method.response.header.Access-Control-Allow-Origin="'*'"

echo "📝 Step 9: Deploying API..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE_NAME \
    --stage-description "Production stage" \
    --description "Production deployment"

echo ""
echo "🎉 API Gateway Setup Complete!"
echo ""
echo "📋 Important Information:"
echo "API ID: $API_ID"
echo "API Gateway URL: https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE_NAME/api/health"
echo ""
echo "🔧 Next Steps:"
echo "1. Update your ApiConfig.ts with the API Gateway URL"
echo "2. Test the endpoint: https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE_NAME/api/health"
echo "3. Add more resources and methods as needed"
echo ""
echo "✨ Your API is now professionally managed through AWS API Gateway!"
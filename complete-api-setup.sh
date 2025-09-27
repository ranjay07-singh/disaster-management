# Complete API Gateway Setup Script
# Run these commands to finish all API Gateway endpoints

echo "🚀 Completing API Gateway setup for Disaster Management System..."

# Emergency endpoint integrations
echo "Setting up emergency endpoints..."
aws apigateway put-integration --rest-api-id mnjvucz4b4 --resource-id pepktc --http-method GET --type HTTP_PROXY --integration-http-method GET --uri "http://54.210.3.62:8080/api/emergency"
aws apigateway put-integration --rest-api-id mnjvucz4b4 --resource-id pepktc --http-method POST --type HTTP_PROXY --integration-http-method POST --uri "http://54.210.3.62:8080/api/emergency"

# Volunteers endpoint methods and integrations
echo "Setting up volunteers endpoints..."
aws apigateway put-method --rest-api-id mnjvucz4b4 --resource-id m8ag6j --http-method GET --authorization-type NONE
aws apigateway put-method --rest-api-id mnjvucz4b4 --resource-id m8ag6j --http-method POST --authorization-type NONE
aws apigateway put-integration --rest-api-id mnjvucz4b4 --resource-id m8ag6j --http-method GET --type HTTP_PROXY --integration-http-method GET --uri "http://54.210.3.62:8080/api/volunteers"
aws apigateway put-integration --rest-api-id mnjvucz4b4 --resource-id m8ag6j --http-method POST --type HTTP_PROXY --integration-http-method POST --uri "http://54.210.3.62:8080/api/volunteers"

# Add method responses for all endpoints
echo "Adding method responses..."
aws apigateway put-method-response --rest-api-id mnjvucz4b4 --resource-id 1ui9rl --http-method GET --status-code 200
aws apigateway put-method-response --rest-api-id mnjvucz4b4 --resource-id 1ui9rl --http-method POST --status-code 200
aws apigateway put-method-response --rest-api-id mnjvucz4b4 --resource-id pepktc --http-method GET --status-code 200
aws apigateway put-method-response --rest-api-id mnjvucz4b4 --resource-id pepktc --http-method POST --status-code 200
aws apigateway put-method-response --rest-api-id mnjvucz4b4 --resource-id m8ag6j --http-method GET --status-code 200
aws apigateway put-method-response --rest-api-id mnjvucz4b4 --resource-id m8ag6j --http-method POST --status-code 200

# Deploy the updated API
echo "Deploying updated API..."
aws apigateway create-deployment --rest-api-id mnjvucz4b4 --stage-name prod --description "Added users, emergency, and volunteers endpoints"

echo "✅ API Gateway setup complete!"
echo "📋 Available endpoints:"
echo "  - GET/POST https://mnjvucz4b4.execute-api.us-east-1.amazonaws.com/prod/api/health"
echo "  - GET/POST https://mnjvucz4b4.execute-api.us-east-1.amazonaws.com/prod/api/users"
echo "  - GET/POST https://mnjvucz4b4.execute-api.us-east-1.amazonaws.com/prod/api/emergency"
echo "  - GET/POST https://mnjvucz4b4.execute-api.us-east-1.amazonaws.com/prod/api/volunteers"
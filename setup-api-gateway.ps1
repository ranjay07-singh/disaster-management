# API Gateway Setup Script for Disaster Management System (PowerShell)
# Run this script to automatically set up API Gateway

param(
    [Parameter(Mandatory=$true)]
    [string]$EC2PublicIP,
    
    [string]$Region = "us-east-1",
    [string]$ApiName = "disaster-management-api",
    [string]$StageName = "prod"
)

Write-Host "Setting up API Gateway for Disaster Management System..." -ForegroundColor Green

try {
    Write-Host "Step 1: Creating REST API..." -ForegroundColor Yellow
    $apiResponse = aws apigateway create-rest-api `
        --name $ApiName `
        --description "Disaster Management REST API Gateway" `
        --endpoint-configuration types=REGIONAL | ConvertFrom-Json
    
    $apiId = $apiResponse.id
    Write-Host "API Created with ID: $apiId" -ForegroundColor Green

    Write-Host "Step 2: Getting root resource..." -ForegroundColor Yellow
    $resourcesResponse = aws apigateway get-resources --rest-api-id $apiId | ConvertFrom-Json
    $rootResourceId = $resourcesResponse.items[0].id
    Write-Host "Root Resource ID: $rootResourceId" -ForegroundColor Green

    Write-Host "Step 3: Creating /api resource..." -ForegroundColor Yellow
    $apiResourceResponse = aws apigateway create-resource `
        --rest-api-id $apiId `
        --parent-id $rootResourceId `
        --path-part "api" | ConvertFrom-Json
    $apiResourceId = $apiResourceResponse.id
    Write-Host "/api Resource ID: $apiResourceId" -ForegroundColor Green

    Write-Host "Step 4: Creating /api/health resource..." -ForegroundColor Yellow
    $healthResourceResponse = aws apigateway create-resource `
        --rest-api-id $apiId `
        --parent-id $apiResourceId `
        --path-part "health" | ConvertFrom-Json
    $healthResourceId = $healthResourceResponse.id
    Write-Host "/api/health Resource ID: $healthResourceId" -ForegroundColor Green

    Write-Host "Step 5: Creating GET method for /api/health..." -ForegroundColor Yellow
    aws apigateway put-method `
        --rest-api-id $apiId `
        --resource-id $healthResourceId `
        --http-method GET `
        --authorization-type NONE | Out-Null

    Write-Host "Step 6: Setting up integration with EC2 backend..." -ForegroundColor Yellow
    aws apigateway put-integration `
        --rest-api-id $apiId `
        --resource-id $healthResourceId `
        --http-method GET `
        --type HTTP_PROXY `
        --integration-http-method GET `
        --uri "http://$($EC2PublicIP):8080/api/health" | Out-Null

    Write-Host "Step 7: Configuring method response..." -ForegroundColor Yellow
    aws apigateway put-method-response `
        --rest-api-id $apiId `
        --resource-id $healthResourceId `
        --http-method GET `
        --status-code 200 | Out-Null

    Write-Host "Step 8: Adding CORS support..." -ForegroundColor Yellow
    # Add OPTIONS method for CORS
    aws apigateway put-method `
        --rest-api-id $apiId `
        --resource-id $healthResourceId `
        --http-method OPTIONS `
        --authorization-type NONE | Out-Null

    # Configure CORS integration
    aws apigateway put-integration `
        --rest-api-id $apiId `
        --resource-id $healthResourceId `
        --http-method OPTIONS `
        --type MOCK `
        --request-templates 'application/json={\"statusCode\": 200}' | Out-Null

    # Configure CORS response
    aws apigateway put-method-response `
        --rest-api-id $apiId `
        --resource-id $healthResourceId `
        --http-method OPTIONS `
        --status-code 200 `
        --response-parameters 'method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false' | Out-Null

    aws apigateway put-integration-response `
        --rest-api-id $apiId `
        --resource-id $healthResourceId `
        --http-method OPTIONS `
        --status-code 200 `
        --response-parameters 'method.response.header.Access-Control-Allow-Headers=\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token\",method.response.header.Access-Control-Allow-Methods=\"GET,POST,PUT,DELETE,OPTIONS\",method.response.header.Access-Control-Allow-Origin=\"*\"' | Out-Null

    Write-Host "Step 9: Deploying API..." -ForegroundColor Yellow
    aws apigateway create-deployment `
        --rest-api-id $apiId `
        --stage-name $StageName `
        --stage-description "Production stage" `
        --description "Production deployment" | Out-Null

    Write-Host ""
    Write-Host "API Gateway Setup Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Important Information:" -ForegroundColor Cyan
    Write-Host "API ID: $apiId" -ForegroundColor White
    Write-Host "API Gateway URL: https://$apiId.execute-api.$Region.amazonaws.com/$StageName/api/health" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Update your ApiConfig.ts with the API Gateway URL" -ForegroundColor White
    Write-Host "2. Test the endpoint: https://$apiId.execute-api.$Region.amazonaws.com/$StageName/api/health" -ForegroundColor White
    Write-Host "3. Add more resources and methods as needed" -ForegroundColor White
    Write-Host ""
    Write-Host "Your API is now professionally managed through AWS API Gateway!" -ForegroundColor Green

    # Test the endpoint
    Write-Host "Testing the endpoint..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5  # Wait for deployment to complete
    try {
        $testUrl = "https://$apiId.execute-api.$Region.amazonaws.com/$StageName/api/health"
        $response = Invoke-RestMethod -Uri $testUrl -Method Get
        Write-Host "Endpoint test successful!" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor White
    }
    catch {
        Write-Host "Endpoint test failed. The API might need a few minutes to become available." -ForegroundColor Yellow
        Write-Host "Try testing manually in a few minutes: https://$apiId.execute-api.$Region.amazonaws.com/$StageName/api/health" -ForegroundColor White
    }

    # Save configuration for later use
    $config = @{
        ApiId = $apiId
        Region = $Region
        StageName = $StageName
        BaseUrl = "https://$apiId.execute-api.$Region.amazonaws.com/$StageName/api"
        EC2PublicIP = $EC2PublicIP
    }

    $config | ConvertTo-Json | Out-File -FilePath "api-gateway-config.json" -Encoding UTF8
    Write-Host "Configuration saved to api-gateway-config.json" -ForegroundColor Green

} catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
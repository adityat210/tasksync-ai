# TaskSync API Contracts

## Purpose

Document tracks the first-pass API surface, maintianing seperation between frontend requeest shapes, backend models, dynamo storage records

## Response format
All HTTP Lamdbda handlers should return a consistent response shape

### Successful response 
```json
{
  "success": true,
  "data": {}
}
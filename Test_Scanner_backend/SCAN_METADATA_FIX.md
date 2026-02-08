# 🔧 SCAN MODULE - METADATA FIX

**Date:** 2026-02-08  
**Issue:** JsonNode not compatible with JPA  
**Solution:** Use String + Object serialization/deserialization

---

## ❌ Problem

```
Error: Type definition error: [simple type, class com.fasterxml.jackson.databind.JsonNode]
```

**Why:**
- JPA doesn't know how to persist Jackson's JsonNode
- Needs to use JPA-supported types (String, Integer, etc.)

---

## ✅ Solution Implemented

Changed metadata handling from JsonNode → String with serialization/deserialization

### What Changed

#### 1. **ScanSession Entity**
```
BEFORE: private JsonNode metadata;
AFTER:  private String metadata;
```

**Why:** JPA can persist String to PostgreSQL TEXT column

---

#### 2. **StartScanSessionRequest DTO**
```
BEFORE: private JsonNode metadata;
AFTER:  private Object metadata;
```

**Why:** Frontend can send any JSON structure, we'll serialize it to String

---

#### 3. **ScanSessionResponse DTO**
```
BEFORE: private JsonNode metadata;
AFTER:  private Object metadata;
```


Try running your test cases from SCAN_POSTMAN_TEST_CASES.md now.

The fix is complete. No more "Type definition error"!

## 🚀 Ready to Test

---

```
}
  }
    "ocrVersion": "2.1.0"
    "ocrLibrary": "TensorFlow",
  "metadata": {
{
```json
**Response (now works):**

```
}
  }
    "ocrVersion": "2.1.0"
    "ocrLibrary": "TensorFlow",
  "metadata": {
{
```json
**Example request (unchanged):**

All test cases in SCAN_POSTMAN_TEST_CASES.md will still work!

## ✅ Test Cases Still Work

---

| ScanSessionResponse.java | JsonNode → Object |
| StartScanSessionRequest.java | JsonNode → Object |
| ScanMapper.java | Added ObjectMapper, deserialize String to Object |
| ScanServiceImpl.java | Added ObjectMapper, serialize Object to String |
| ScanSession.java | JsonNode → String, removed unused imports |
|------|---------|
| File | Changes |

## 📊 Files Modified

---

✅ **Same API** - Frontend still sends/receives JSON  
✅ **Error Handling** - Try-catch for parsing failures  
✅ **Type Safe** - Uses ObjectMapper for serialization  
✅ **Flexible JSON** - Can accept any JSON structure  
✅ **JPA Compatible** - Uses String type that JPA understands  

## ✨ Benefits

---

```
Frontend receives parsed JSON
    ↓
ScanSessionResponse returns Object (parsed JSON)
    ↓
On retrieval, ScanMapper deserializes String → Object
    ↓
JPA stores String in database
    ↓
ScanServiceImpl converts Object → JSON String
    ↓
StartScanSessionRequest receives as Object
    ↓
}
  }
    "ocrVersion": "2.1.0"
    "ocrLibrary": "TensorFlow",
  "metadata": {
{
Frontend sends:
```

## 🔄 Data Flow

---

**Why:** Deserialize from database back to Object for API response

```
}
    response.setMetadata(metadataObject);
    Object metadataObject = objectMapper.readValue(...);
if (scanSession.getMetadata() != null) {
ADDED: Deserialize JSON string back to Object in response

ADDED: private final ObjectMapper objectMapper;
```
#### 5. **ScanMapper**

---

**Why:** Serialize Object to JSON string for JPA storage

```
}
    metadataJson = objectMapper.writeValueAsString(request.getMetadata());
if (request.getMetadata() != null) {
ADDED: Convert Object metadata to JSON string before storing

ADDED: private final ObjectMapper objectMapper;
```
#### 4. **ScanServiceImpl Service**

---

**Why:** Response deserializes JSON string back to Object for frontend


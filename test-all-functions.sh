#!/bin/bash

# Test script for all RSS Developer Suite functions
# Valid URLs
VALID_URL1="http://feeds.bbci.co.uk/news/rss.xml"
VALID_URL2="https://a16z.com/feed/"

# Invalid URLs
INVALID_URL1="http://feeds.bbci.co.uk/old-news/rss.xml"
INVALID_URL2="https://techcrunch.com"

API_BASE="http://localhost:3001/api"

echo "=========================================="
echo "RSS Developer Suite - Comprehensive Test"
echo "=========================================="
echo ""
echo "Valid URLs:"
echo "  - $VALID_URL1"
echo "  - $VALID_URL2"
echo ""
echo "Invalid URLs:"
echo "  - $INVALID_URL1 (404)"
echo "  - $INVALID_URL2 (Non-feed)"
echo ""
echo "=========================================="
echo ""

# Test function
test_endpoint() {
    local endpoint=$1
    local url=$2
    local test_name=$3
    
    echo "Testing: $test_name"
    echo "URL: $url"
    echo "Endpoint: $endpoint"
    
    response=$(curl -s -X POST "$API_BASE$endpoint" \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"$url\"}" 2>&1)
    
    # Check for validate endpoint format (different response structure)
    if echo "$response" | grep -q '"valid":true'; then
        echo "✅ SUCCESS (Valid Feed)"
        feed_type=$(echo "$response" | grep -o '"feedType":"[^"]*"' | cut -d'"' -f4 || echo "")
        if [ ! -z "$feed_type" ]; then
            echo "   Feed Type: $feed_type"
        fi
        issues=$(echo "$response" | grep -o '"issues":\[.*\]' | grep -o '\]' | wc -l | tr -d ' ')
        if [ "$issues" = "0" ]; then
            echo "   Issues: None"
        fi
    elif echo "$response" | grep -q '"valid":false'; then
        echo "❌ FAILED (Invalid Feed)"
        error=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4 | head -1)
        if [ ! -z "$error" ]; then
            echo "   Error: $error"
        fi
    elif echo "$response" | grep -q '"success":true'; then
        echo "✅ SUCCESS"
        # Extract key info
        if echo "$response" | grep -q '"feedType"'; then
            feed_type=$(echo "$response" | grep -o '"feedType":"[^"]*"' | cut -d'"' -f4)
            echo "   Feed Type: $feed_type"
        fi
        if echo "$response" | grep -q '"items"'; then
            items=$(echo "$response" | grep -o '"items":\[.*\]' | head -1)
            if [ ! -z "$items" ]; then
                item_count=$(echo "$items" | grep -o '{' | wc -l | tr -d ' ')
                echo "   Items: $item_count"
            fi
        fi
    elif echo "$response" | grep -q '"success":false'; then
        error=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo "❌ FAILED: $error"
    else
        echo "⚠️  UNEXPECTED RESPONSE"
        echo "$response" | head -3
    fi
    echo ""
}

# Test compare endpoint
test_compare() {
    local url1=$1
    local url2=$2
    
    echo "Testing: Feed Comparison"
    echo "URL1: $url1"
    echo "URL2: $url2"
    echo "Endpoint: /compare"
    
    response=$(curl -s -X POST "$API_BASE/compare" \
        -H "Content-Type: application/json" \
        -d "{\"url1\": \"$url1\", \"url2\": \"$url2\"}" 2>&1)
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ SUCCESS"
        similarity=$(echo "$response" | grep -o '"similarity":[0-9.]*' | cut -d':' -f2)
        if [ ! -z "$similarity" ]; then
            echo "   Similarity: ${similarity}%"
        fi
    elif echo "$response" | grep -q '"success":false'; then
        error=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo "❌ FAILED: $error"
    else
        echo "⚠️  UNEXPECTED RESPONSE"
    fi
    echo ""
}

# Test OPML generate
test_opml_generate() {
    local url=$1
    
    echo "Testing: OPML Generate"
    echo "URL: $url"
    echo "Endpoint: /opml/generate"
    
    response=$(curl -s -X POST "$API_BASE/opml/generate" \
        -H "Content-Type: application/json" \
        -d "{\"feedUrls\": [\"$url\"]}" 2>&1)
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ SUCCESS"
        opml_length=$(echo "$response" | grep -o '"opml":"[^"]*"' | cut -d'"' -f4 | wc -c)
        echo "   OPML Length: $opml_length chars"
    elif echo "$response" | grep -q '"success":false'; then
        error=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo "❌ FAILED: $error"
    else
        echo "⚠️  UNEXPECTED RESPONSE"
    fi
    echo ""
}

echo "════════════════════════════════════════"
echo "TESTING WITH VALID URL 1: BBC News"
echo "════════════════════════════════════════"
echo ""

test_endpoint "/parse" "$VALID_URL1" "Parse Feed"
test_endpoint "/validate" "$VALID_URL1" "Validate Feed"
test_endpoint "/preview" "$VALID_URL1" "Preview Feed"
test_endpoint "/cache-test" "$VALID_URL1" "Cache Test"
test_endpoint "/accessibility" "$VALID_URL1" "Accessibility Check"
test_endpoint "/robots-test" "$VALID_URL1" "Robots Test"
test_endpoint "/websub-test" "$VALID_URL1" "WebSub Test"
# Test convert endpoint
test_convert() {
    local url=$1
    local target=$2
    
    echo "Testing: Convert Feed (to $target)"
    echo "URL: $url"
    echo "Endpoint: /convert"
    
    response=$(curl -s -X POST "$API_BASE/convert" \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"$url\", \"targetType\": \"$target\"}" 2>&1)
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ SUCCESS"
        original=$(echo "$response" | grep -o '"originalType":"[^"]*"' | cut -d'"' -f4)
        target_type=$(echo "$response" | grep -o '"targetType":"[^"]*"' | cut -d'"' -f4)
        echo "   Original: $original → Target: $target_type"
    elif echo "$response" | grep -q '"success":false'; then
        error=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo "❌ FAILED: $error"
    else
        echo "⚠️  UNEXPECTED RESPONSE"
    fi
    echo ""
}
test_endpoint "/link-check" "$VALID_URL1" "Link Check"
test_endpoint "/statistics" "$VALID_URL1" "Statistics"
test_opml_generate "$VALID_URL1"

echo ""
echo "════════════════════════════════════════"
echo "TESTING WITH VALID URL 2: a16z"
echo "════════════════════════════════════════"
echo ""

test_endpoint "/parse" "$VALID_URL2" "Parse Feed"
test_endpoint "/validate" "$VALID_URL2" "Validate Feed"
test_endpoint "/preview" "$VALID_URL2" "Preview Feed"
test_endpoint "/cache-test" "$VALID_URL2" "Cache Test"
test_endpoint "/accessibility" "$VALID_URL2" "Accessibility Check"
test_endpoint "/robots-test" "$VALID_URL2" "Robots Test"
test_endpoint "/websub-test" "$VALID_URL2" "WebSub Test"
test_convert "$VALID_URL2" "json"
test_endpoint "/link-check" "$VALID_URL2" "Link Check"
test_endpoint "/statistics" "$VALID_URL2" "Statistics"
test_opml_generate "$VALID_URL2"

echo ""
echo "════════════════════════════════════════"
echo "TESTING COMPARE (Valid URLs)"
echo "════════════════════════════════════════"
echo ""
test_compare "$VALID_URL1" "$VALID_URL2"

echo ""
echo "════════════════════════════════════════"
echo "TESTING WITH INVALID URL 1: 404 Error"
echo "════════════════════════════════════════"
echo ""

test_endpoint "/parse" "$INVALID_URL1" "Parse Feed (404)"
test_endpoint "/validate" "$INVALID_URL1" "Validate Feed (404)"
test_endpoint "/preview" "$INVALID_URL1" "Preview Feed (404)"
test_endpoint "/cache-test" "$INVALID_URL1" "Cache Test (404)"
test_endpoint "/accessibility" "$INVALID_URL1" "Accessibility Check (404)"
test_endpoint "/robots-test" "$INVALID_URL1" "Robots Test (404)"
test_endpoint "/websub-test" "$INVALID_URL1" "WebSub Test (404)"
test_convert "$INVALID_URL1" "rss"
test_endpoint "/link-check" "$INVALID_URL1" "Link Check (404)"
test_endpoint "/statistics" "$INVALID_URL1" "Statistics (404)"

echo ""
echo "════════════════════════════════════════"
echo "TESTING WITH INVALID URL 2: Non-Feed"
echo "════════════════════════════════════════"
echo ""

test_endpoint "/parse" "$INVALID_URL2" "Parse Feed (Non-Feed)"
test_endpoint "/validate" "$INVALID_URL2" "Validate Feed (Non-Feed)"
test_endpoint "/preview" "$INVALID_URL2" "Preview Feed (Non-Feed)"
test_endpoint "/cache-test" "$INVALID_URL2" "Cache Test (Non-Feed)"
test_endpoint "/accessibility" "$INVALID_URL2" "Accessibility Check (Non-Feed)"
test_endpoint "/robots-test" "$INVALID_URL2" "Robots Test (Non-Feed)"
test_endpoint "/websub-test" "$INVALID_URL2" "WebSub Test (Non-Feed)"
test_convert "$INVALID_URL2" "rss"
test_endpoint "/link-check" "$INVALID_URL2" "Link Check (Non-Feed)"
test_endpoint "/statistics" "$INVALID_URL2" "Statistics (Non-Feed)"

echo ""
echo "=========================================="
echo "TEST COMPLETE"
echo "=========================================="


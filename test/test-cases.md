# Test Cases for HabitBounty
## API
- Invalid JSON -- will currently cause the server to crash
    - This can occur anywhere there is a `JSON.parse()` or `JSON.stringify()` call
- `reward` JSON attribute is not necessarily a number
    - Always coerce to a number or enforce the client to provide it as a number
    - There will always be a chance for erroring out when coercion is used
- `name` and `reward` aren't both provided

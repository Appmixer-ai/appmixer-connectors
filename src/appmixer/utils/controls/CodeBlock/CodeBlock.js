'use strict';

/**
 IMPORTANT NOTES:
 1. **NO TOP-LEVEL RETURN**: You CANNOT use 'return' at the top level of your code!
 The last expression is automatically returned by evalSync().
 - CORRECT: '$data.value * 2'
 - WRONG: 'return $data.value * 2'  // Throws "Illegal return statement"
 - To use return statements, wrap in IIFE: '(function() { return $data.value * 2; })()'

 2. Security: evalJavaScript runs code in an isolated environment with memory limits
 3. No external modules: You cannot require() modules inside the evaluated code
 4. No async: The evaluated code runs synchronously
 5. No process.exit: Calling process.exit() will throw an error
 6. Memory limit: Default is set by ISOLATE_MAX_MEMORY config
 7. Data must be JSON-serializable: The jsonData parameter must be convertible to JSON
 8. Return value: The last expression value is returned (or undefined if no expression)

Examples:
--------------------------------------------------
 const fullName = $data.firstName + ' ' + $data.lastName;
 fullName.toUpperCase();
--------------------------------------------------
 function sum(a, b) {
 return a + b;
 }
 sum($data.x, $data.y);
--------------------------------------------------
 $data.numbers
 .filter(n => n > 10)
   .map(n => n * 2)
   .reduce((sum, n) => sum + n, 0);
--------------------------------------------------
 const user = $data.user;
 JSON.stringify({
     fullName: user.firstName + ' ' + user.lastName,
     isAdult: user.age >= 18,
     email: user.email.toLowerCase()
 });
--------------------------------------------------
 (function() {
 const score = $data.score;
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
 return 'F';
 })();
--------------------------------------------------
--------------------------------------------------

*/

module.exports = {

    async receive(context) {

        const { variables, code } = context.messages.in.content;

        if (!code) {
            throw new context.CancelError('Code is required');
        }

        const variablesArray = variables?.ADD || [];

        const args = variablesArray.reduce((res, item) => {
            const { name, type, ...value } = item;
            res[name] = value[type];
            return res;
        }, {});

        await context.log({ 'step': 'variables', args });

        let result = context.evalJavaScript(code, args);

        try {
            result = JSON.parse(result);
        } catch {
            // not JSON, return as is
        }

        return context.sendJson({ result }, 'out');
    }
};

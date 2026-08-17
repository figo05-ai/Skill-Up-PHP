<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException || $e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                    return response()->json([
                        'status' => 'Error',
                        'message' => 'Resource not found.',
                        'data' => null
                    ], 404);
                }

                if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    return response()->json([
                        'status' => 'Error',
                        'message' => 'Unauthenticated.',
                        'data' => null
                    ], 401);
                }

                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    return response()->json([
                        'status' => 'Error',
                        'message' => 'Validation Error.',
                        'data' => $e->errors()
                    ], 422);
                }

                return response()->json([
                    'status' => 'Error',
                    'message' => config('app.debug') ? $e->getMessage() : 'Server Error.',
                    'data' => null
                ], $e instanceof \Symfony\Component\HttpKernel\Exception\HttpException ? $e->getStatusCode() : 500);
            }
        });
    })->create();

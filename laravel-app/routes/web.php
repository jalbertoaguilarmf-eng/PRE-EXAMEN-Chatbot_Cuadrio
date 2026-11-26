<?php

use App\Http\Controllers\ClientDirectoryController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ClientDirectoryController::class, 'index'])->name('directory');
Route::get('/api/health', [ClientDirectoryController::class, 'health'])->name('api.health');
Route::get('/api/dashboard', [ClientDirectoryController::class, 'dashboard'])->name('api.dashboard');
Route::post('/api/chat', [ClientDirectoryController::class, 'chat'])->name('api.chat');

<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreClientRequest;
use App\Http\Requests\Client\UpdateClientRequest;
use App\Http\Responses\ApiResponse;
use App\Interfaces\Client\ClientServiceInterface;
use App\Http\Resources\ClientResource;

class ClientController extends Controller
{
    use ApiResponse;

    protected ClientServiceInterface $clientService;

    public function __construct(ClientServiceInterface $clientService)
    {
        $this->clientService = $clientService;
    }

    public function index()
    {
        $clients = $this->clientService->getAllClients();
        return $this->successResponse(ClientResource::collection($clients)->response()->getData(true), 'Clients retrieved successfully.');
    }

    public function show($id)
    {
        $client = $this->clientService->getClientById($id);
        
        if (!$client) {
            return $this->errorResponse('Client not found.', 404);
        }

        return $this->successResponse(new ClientResource($client), 'Client retrieved successfully.');
    }

    public function store(StoreClientRequest $request)
    {
        $client = $this->clientService->createClient($request->validated());
        return $this->successResponse(new ClientResource($client), 'Client created successfully.', 201);
    }

    public function update(UpdateClientRequest $request, $id)
    {
        $client = $this->clientService->updateClient($id, $request->validated());

        if (!$client) {
            return $this->errorResponse('Client not found.', 404);
        }

        return $this->successResponse(new ClientResource($client), 'Client updated successfully.');
    }

    public function destroy($id)
    {
        $deleted = $this->clientService->deleteClient($id);

        if (!$deleted) {
            return $this->errorResponse('Client not found.', 404);
        }

        return $this->successResponse(null, 'Client deleted successfully.');
    }
}

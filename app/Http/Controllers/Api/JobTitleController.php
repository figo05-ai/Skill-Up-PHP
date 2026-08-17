<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class JobTitleController extends Controller
{
    public function getMap()
    {
        $jobTitles = \App\Models\JobTitle::all();
        $map = [];
        foreach ($jobTitles as $jt) {
            $map[$jt->title] = $jt->tasks;
        }
        return response()->json($map);
    }

    public function indexAdmin()
    {
        return response()->json(\App\Models\JobTitle::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|unique:job_titles',
            'tasks' => 'required|array'
        ]);

        $jobTitle = \App\Models\JobTitle::create($request->only(['title', 'tasks']));
        return response()->json($jobTitle, 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string|unique:job_titles,title,' . $id,
            'tasks' => 'required|array'
        ]);

        $jobTitle = \App\Models\JobTitle::findOrFail($id);
        $jobTitle->update($request->only(['title', 'tasks']));
        return response()->json($jobTitle);
    }

    public function destroy($id)
    {
        \App\Models\JobTitle::destroy($id);
        return response()->json(['message' => 'Deleted successfully']);
    }
}

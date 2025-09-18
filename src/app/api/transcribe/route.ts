import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data with audio file' }, { status: 400 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Validate it's an audio file
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'Invalid file type. Expected audio file.' }, { status: 400 })
    }

    console.log(`🎤 Processing audio file: ${audioFile.name}, size: ${audioFile.size} bytes`)

    // Convert File to Buffer
    const audioBuffer = await audioFile.arrayBuffer()
    
    // Call Deepgram API
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=es&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': audioFile.type
      },
      body: audioBuffer
    })

    if (!response.ok) {
      console.error('Deepgram API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Deepgram error details:', errorText)
      return NextResponse.json({ error: 'Transcription service failed' }, { status: 500 })
    }

    const result = await response.json()
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    
    console.log(`✅ Transcription successful: "${transcript}"`)
    
    return NextResponse.json({ transcript })
    
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
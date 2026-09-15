# AI Generative Fill — Licenses & Usage Terms

## Provider
**Stability AI Ltd.**  
https://stability.ai

## Model
**Stable Diffusion Inpainting** (`stabilityai/stable-diffusion-2-inpainting` or equivalent commercial inpainting model)

## Model License
**CreativeML Open RAIL++-M License**  
- Permits commercial use  
- Allows SaaS and hosted applications  
- Requires attribution when model outputs are shared publicly  
- Prohibits generation of harmful or illegal content  
- Full text: https://huggingface.co/stabilityai/stable-diffusion-2-inpainting/blob/main/LICENSE

## API Terms
- Stability AI Commercial API Terms: https://stability.ai/terms-of-service  
- API usage is subject to the Stability AI Customer Agreement  
- Outputs generated via the API may be used commercially

## Commercial-Use Status
✅ **Permitted** — The model license and API terms allow commercial use, including SaaS products.

## Attribution Requirements
- When sharing model outputs publicly, attribution to Stability AI is appreciated but not strictly required for API outputs.
- Do not claim the model or outputs as your own proprietary technology.

## Pricing / Free Tier Notes
- Stability AI does not offer a permanent free tier for production API access.
- Pay-as-you-go pricing applies per generated image.
- Check https://platform.stability.ai/pricing for current rates.

## Source / Documentation
- API Documentation: https://api.stability.ai/docs  
- Inpainting Endpoint: `POST /v2beta/stable-image/edit/inpaint`  
- Model Weights: https://huggingface.co/stabilityai/stable-diffusion-2-inpainting

## Implementation Notes
- The frontend never sees the API key.
- All generation requests go through the local backend proxy at `POST /api/generative-fill`.
- The backend forwards the image, mask, and prompt to Stability AI and returns the generated image.

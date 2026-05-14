GEN_PARAGRAPH_FROM_TREE_JINJA = """
You are given a tree, generate a short, single sentence, research note about it

Here is the framing context. One sentence should be generated to connect the main content
to the context:
{{ ancestor_context }}

{% if main_topic is defined and main_topic %}
Here is the topic for the main content. Dedicate most of the paragraph to this:
{{ main_topic }}
{% endif %}

{% if user_guidance is defined and user_guidance %}
Here is some additional user guidance, you must follow this exactly as stated
{{ user_guidance }}
{% endif %}

Here are some requirements:
- Dense Facts: Should contain explicit references to maximum facts
- Terse: Prose terse
- No Section headings
- Generated entry should be in the style of wikipedia                        
Now go generate it:
"""

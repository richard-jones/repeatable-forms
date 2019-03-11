var repeater = {
    
    config : {},

    init : function(params) {
        repeater.config = params;
        repeater.on();
    },

    off : function() {
        var containers = $(repeater.config.repeatableSelector);
        var adds = containers.find(repeater.config.addSelector);
        adds.off("click.Repeater");

        var removes = containers.find(repeater.config.removeSelector);
        removes.off("click.Repeater");
    },

    on : function() {
        var containers = $(repeater.config.repeatableSelector);

        var adds = containers.find(repeater.config.addSelector);
        adds.on("click.Repeater", repeater.onAdd);

        var removes = containers.find(repeater.config.removeSelector);
        removes.each(function() {
            var $this = $(this);
            var nearest = $this.closest(repeater.config.repeatableSelector);
            var sections = repeater._getDirectRepeatableSections(nearest);
            if (sections.length === 1) {
                $this.hide();
            } else {
                $this.show();
            }
        });

        removes.on("click.Repeater", repeater.onRemove);
    },

    onRemove : function(event) {
        event.preventDefault();
        repeater.off();
        var el = $(event.target);
        var section = el.closest(repeater.config.repeatableSection);
        var container = el.closest(repeater.config.repeatableSelector);
        section.remove();
        repeater._renumber(container);
        repeater.on();
    },

    onAdd : function(event) {
        event.preventDefault();
        repeater.off();
        var el = $(event.target);
        var container = el.closest(repeater.config.repeatableSelector);
        var sectionList = repeater._getDirectSectionList(container);
        var repeatable = repeater._getDirectRepeatableSections(container);
        var template = repeatable.last();
        var newId = repeatable.length;
        var indexRx = new RegExp(container.attr("data-index-rx"));
        var newSection = repeater._newSection({
            template: template,
            newId : newId,
            regex : indexRx
        });
        sectionList.append(newSection);
        newSection.find(repeater.config.formControl).first().focus();
        repeater.on();
    },

    _getDirectRepeatableSections : function(container) {
        return container.find(repeater.config.repeatableSection).not(function(index) {
            var nearest = $(this).closest(repeater.config.repeatableSelector);
            return nearest[0] !== container[0];
        });
    },

    _getDirectSectionList : function(container) {
        return container.find(repeater.config.repeatableList).not(function(index) {
            var nearest = $(this).closest(repeater.config.repeatableSelector);
            return nearest[0] !== container[0];
        });
    },

    _getDirectRepeatable : function(container) {
        return container.find(repeater.config.repeatableSelector).not(function(index) {
            var nearest = $(this).closest(repeater.config.repeatableSelector);
            return nearest[0] !== container[0];
        });
    },

    _newSection : function(params) {
        var newSection = params.template.clone();

        repeater._pruneSubsections({parent: newSection});
        repeater._updateSectionIndexes({section: newSection, newId : params.newId, regex: params.regex});

        newSection.find(repeater.config.formControl).val("");

        return newSection;
    },

    _pruneSubsections : function(params) {
        var parent = params.parent;

        var subs = repeater._getDirectRepeatable(parent);
        subs.each(function() {
            var sections = repeater._getDirectRepeatableSections($(this));
            // remove all but the first section
            for (var i = 1; i < sections.length; i++) {
                $(sections[i]).remove();
            }
            // recurse into the remaining section
            repeater._pruneSubsections({parent: $(sections[0])})
        });
    },
    
    _updateSectionIndexes : function(params) {
        var section = params.section;
        
        section.find('label').each(function () {
            var label = $(this);
            var currentLabel = label.attr('for');
            var newLabel = currentLabel.replace(params.regex, "$1" + params.newId + "$3");
            label.attr('for', newLabel);
        });

        section.find(repeater.config.formControl).each(function () {
            var formControl = $(this);
            var currentId = formControl.attr('id');
            var newId = currentId.replace(params.regex, "$1" + params.newId + "$3");
            formControl.attr('id', newId);
            formControl.attr("name", newId);
        });
    },

    _renumber : function(container) {
        var indexRx = new RegExp(container.attr("data-index-rx"));
        var repeatable = repeater._getDirectRepeatableSections(container);
        for (var i = 0; i < repeatable.length; i++) {
            var section = $(repeatable[i]);
            repeater._updateSectionIndexes({section: section, newId : i, regex: indexRx});
            var subcontainers = section.find(repeater.config.repeatableSelector);
            subcontainers.each(function() {
                repeater._renumber($(this));
            });
        }
    }
};